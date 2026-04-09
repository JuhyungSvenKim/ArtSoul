import type { VercelRequest, VercelResponse } from '@vercel/node'
import { DEFAULT_PACKAGES } from '../_lib/payments'
import { getSupabase } from '../_lib/supabase'
import { setCors } from '../_lib/cors'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('coin_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    return res.status(200).json({
      success: true,
      packages: data && data.length > 0 ? data : DEFAULT_PACKAGES,
    })
  } catch {
    return res.status(200).json({ success: true, packages: DEFAULT_PACKAGES })
  }
}
