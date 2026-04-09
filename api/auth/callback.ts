import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const code = req.query.code as string
  const origin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`

  if (!code) return res.redirect(302, `${origin}/login?error=no_code`)

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.session) {
      return res.redirect(302, `${origin}/login?error=auth_failed`)
    }

    const user = data.session.user
    const provider = user.app_metadata?.provider || 'unknown'

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

      const { data: existingCoins } = await adminSupabase
        .from('user_coins')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!existingCoins) {
        await adminSupabase.from('user_coins').insert({ user_id: user.id, coins: 10 })
        await adminSupabase.from('coin_transactions').insert({
          user_id: user.id,
          amount: 10,
          balance_after: 10,
          transaction_type: 'signup_bonus',
          description: '가입 축하 보너스 10코인',
        })
      }
    }

    const accessToken = data.session.access_token
    return res.redirect(302, `${origin}/?token=${accessToken}`)
  } catch {
    return res.redirect(302, `${origin}/login?error=server_error`)
  }
}
