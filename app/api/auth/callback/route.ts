/**
 * GET /api/auth/callback — Supabase OAuth 콜백 (Kakao, Apple)
 *
 * Supabase Auth가 소셜 로그인 완료 후 리다이렉트하는 URL.
 * code를 세션으로 교환하고 프로필을 생성/업데이트.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const origin = url.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // code → session 교환
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.session) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    const user = data.session.user
    const provider = user.app_metadata?.provider || 'unknown'

    // 서비스키로 프로필 upsert
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceKey) {
      const adminSupabase = createClient(SUPABASE_URL, serviceKey)

      await adminSupabase.from('user_profiles').upsert({
        user_id: user.id,
        display_name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url || null,
        provider,
        provider_id: user.user_metadata?.provider_id || null,
        role: 'user',
      }, { onConflict: 'user_id' })

      // 신규 유저면 코인 지급
      const { data: existingCoins } = await adminSupabase
        .from('user_coins')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!existingCoins) {
        await adminSupabase.from('user_coins').insert({
          user_id: user.id,
          coins: 10,
        })
        await adminSupabase.from('coin_transactions').insert({
          user_id: user.id,
          amount: 10,
          balance_after: 10,
          transaction_type: 'signup_bonus',
          description: '가입 축하 보너스 10코인',
        })
      }
    }

    // 토큰을 쿠키나 URL로 전달
    const accessToken = data.session.access_token
    return NextResponse.redirect(`${origin}/?token=${accessToken}`)
  } catch (error) {
    return NextResponse.redirect(`${origin}/login?error=server_error`)
  }
}
