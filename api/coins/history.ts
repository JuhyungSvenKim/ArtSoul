import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase } from '../_lib/supabase'
import { setCors } from '../_lib/cors'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const userId = req.query.userId as string
    const limit = parseInt(req.query.limit as string || '20')

    if (!userId) return res.status(400).json({ success: false, error: 'userId required' })

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('coin_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return res.status(500).json({ success: false, error: error.message })

    return res.status(200).json({ success: true, transactions: data })
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message })
  }
}
