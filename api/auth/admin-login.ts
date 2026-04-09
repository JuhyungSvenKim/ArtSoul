import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SUPERADMIN, createAdminToken } from '../_lib/auth'
import { getSupabase } from '../_lib/supabase'
import { setCors } from '../_lib/cors'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { id, password } = req.body
    if (!id || !password) {
      return res.status(400).json({ success: false, error: 'id, password 필수' })
    }

    if (id === SUPERADMIN.id && password === SUPERADMIN.password) {
      const token = createAdminToken(SUPERADMIN.id, 'superadmin')
      const supabase = getSupabase()

      await supabase.from('user_profiles').upsert({
        user_id: `admin_${SUPERADMIN.id}`,
        display_name: 'SuperAdmin',
        email: SUPERADMIN.email,
        role: 'superadmin',
        provider: 'admin',
      }, { onConflict: 'user_id' })

      await supabase.from('user_coins').upsert({
        user_id: `admin_${SUPERADMIN.id}`,
        coins: 9999,
      }, { onConflict: 'user_id' })

      return res.status(200).json({
        success: true,
        token,
        profile: {
          user_id: `admin_${SUPERADMIN.id}`,
          display_name: 'SuperAdmin',
          email: SUPERADMIN.email,
          role: 'superadmin',
          is_verified: true,
        },
      })
    }

    const supabase = getSupabase()
    const { data: adminProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', `admin_${id}`)
      .in('role', ['admin', 'superadmin'])
      .single()

    if (!adminProfile) {
      return res.status(401).json({ success: false, error: '아이디 또는 비밀번호가 잘못되었습니다' })
    }

    const token = createAdminToken(id, adminProfile.role)
    return res.status(200).json({ success: true, token, profile: adminProfile })
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message })
  }
}
