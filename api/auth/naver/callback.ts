import type { VercelRequest, VercelResponse } from '@vercel/node'
import { NAVER_OAUTH, createAdminToken } from '../../_lib/auth'
import { getSupabase } from '../../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const code = req.query.code as string
  const state = req.query.state as string
  const origin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`

  if (!code) return res.redirect(302, `${origin}/login?error=no_code`)

  try {
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
      return res.redirect(302, `${origin}/login?error=naver_token_failed`)
    }

    const profileRes = await fetch(NAVER_OAUTH.profileUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profileData = await profileRes.json()

    if (profileData.resultcode !== '00') {
      return res.redirect(302, `${origin}/login?error=naver_profile_failed`)
    }

    const naverUser = profileData.response
    const naverId = `naver_${naverUser.id}`

    const supabase = getSupabase()

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

    const token = createAdminToken(naverId, 'user')
    return res.redirect(302, `${origin}/?token=${token}&provider=naver`)
  } catch {
    return res.redirect(302, `${origin}/login?error=server_error`)
  }
}
