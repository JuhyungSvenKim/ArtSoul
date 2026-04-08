/**
 * GET /api/auth/naver/callback — 네이버 OAuth 콜백
 *
 * Supabase가 네이버를 네이티브 지원하지 않으므로 수동 구현.
 * code → accessToken → 프로필 조회 → 유저 생성/로그인
 */
import { NextResponse } from 'next/server'
import { NAVER_OAUTH } from '@/lib/auth'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const origin = url.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  try {
    // 1) code → access_token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: NAVER_OAUTH.clientId,
      client_secret: NAVER_OAUTH.clientSecret,
      code,
      state: state || '',
    })

    const tokenRes = await fetch(`${NAVER_OAUTH.tokenUrl}?${tokenParams}`)
    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${origin}/login?error=naver_token_failed`)
    }

    // 2) access_token → 프로필
    const profileRes = await fetch(NAVER_OAUTH.profileUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profileData = await profileRes.json()

    if (profileData.resultcode !== '00') {
      return NextResponse.redirect(`${origin}/login?error=naver_profile_failed`)
    }

    const naverUser = profileData.response
    const naverId = `naver_${naverUser.id}`

    // 3) 유저 프로필 upsert
    const supabase = getSupabaseServer()

    await supabase.from('user_profiles').upsert({
      user_id: naverId,
      display_name: naverUser.nickname || naverUser.name || '',
      email: naverUser.email || null,
      phone: naverUser.mobile?.replace(/-/g, '') || null,
      avatar_url: naverUser.profile_image || null,
      provider: 'naver',
      provider_id: naverUser.id,
      role: 'user',
    }, { onConflict: 'user_id' })

    // 4) 코인 지급 (신규)
    const { data: existingCoins } = await supabase
      .from('user_coins')
      .select('id')
      .eq('user_id', naverId)
      .single()

    if (!existingCoins) {
      await supabase.from('user_coins').insert({ user_id: naverId, coins: 10 })
      await supabase.from('coin_transactions').insert({
        user_id: naverId,
        amount: 10,
        balance_after: 10,
        transaction_type: 'signup_bonus',
        description: '가입 축하 보너스 10코인',
      })
    }

    // 5) 자체 토큰 발급 (네이버는 Supabase Auth 밖이므로)
    const { createAdminToken } = await import('@/lib/auth')
    const token = createAdminToken(naverId, 'user')

    return NextResponse.redirect(`${origin}/?token=${token}&provider=naver`)
  } catch (error) {
    return NextResponse.redirect(`${origin}/login?error=server_error`)
  }
}
