import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase } from '../_lib/supabase'
import { setCors } from '../_lib/cors'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ success: false, error: 'userId required' })

    const supabase = getSupabase()

    const today = new Date().toISOString().slice(0, 10)
    const { data: todayBonus } = await supabase
      .from('coin_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('transaction_type', 'share_bonus')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .limit(1)

    if (todayBonus && todayBonus.length > 0) {
      return res.status(409).json({
        success: false,
        error: '오늘은 이미 공유 보너스를 받았습니다',
        alreadyClaimed: true,
      })
    }

    const { data: current } = await supabase
      .from('user_coins')
      .select('coins')
      .eq('user_id', userId)
      .single()

    if (!current) return res.status(404).json({ success: false, error: '유저 정보를 찾을 수 없습니다' })

    const bonus = 2
    const newBalance = current.coins + bonus

    await supabase.from('user_coins')
      .update({ coins: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    await supabase.from('coin_transactions').insert({
      user_id: userId,
      amount: bonus,
      balance_after: newBalance,
      transaction_type: 'share_bonus',
      description: '사주 결과 공유 보너스 +2코인',
    })

    return res.status(200).json({
      success: true,
      bonus,
      coins: newBalance,
      message: '공유 보너스 2코인이 지급되었습니다!',
    })
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message })
  }
}
