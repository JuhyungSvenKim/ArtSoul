import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAdminToken } from '../_lib/auth'
import { getSupabase } from '../_lib/supabase'
import { setCors } from '../_lib/cors'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: '로그인이 필요합니다' })
    }

    const token = authHeader.slice(7)
    const supabase = getSupabase()

    // 어드민 토큰 체크
    const adminPayload = verifyAdminToken(token)
    if (adminPayload) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', `admin_${adminPayload.sub}`)
        .single()

      const { data: coins } = await supabase
        .from('user_coins')
        .select('coins')
        .eq('user_id', `admin_${adminPayload.sub}`)
        .single()

      return res.status(200).json({
        success: true,
        profile: { ...profile, coins: coins?.coins ?? 0 },
      })
    }

    // Supabase Auth 토큰 체크 (소셜 로그인)
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ success: false, error: '유효하지 않은 토큰입니다' })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const { data: coins } = await supabase
      .from('user_coins')
      .select('coins')
      .eq('user_id', user.id)
      .single()

    return res.status(200).json({
      success: true,
      profile: {
        ...(profile || {
          user_id: user.id,
          display_name: user.user_metadata?.name || user.email?.split('@')[0] || '',
          email: user.email,
          role: 'user',
          is_verified: false,
          provider: user.app_metadata?.provider || null,
        }),
        coins: coins?.coins ?? 0,
      },
    })
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message })
  }
}
