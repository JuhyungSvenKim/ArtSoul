import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase } from '../_lib/supabase'
import { setCors } from '../_lib/cors'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  const supabase = getSupabase()

  if (req.method === 'GET') {
    try {
      const userId = req.query.userId as string
      if (!userId) return res.status(400).json({ success: false, error: 'userId required' })

      let { data, error } = await supabase
        .from('user_coins')
        .select('coins')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        const { data: newData, error: insertError } = await supabase
          .from('user_coins')
          .insert({ user_id: userId, coins: 10 })
          .select('coins')
          .single()

        if (insertError) return res.status(500).json({ success: false, error: insertError.message })

        await supabase.from('coin_transactions').insert({
          user_id: userId,
          amount: 10,
          balance_after: 10,
          transaction_type: 'signup_bonus',
          description: '가입 축하 보너스 10코인',
        })
        data = newData
      }

      return res.status(200).json({ success: true, coins: data!.coins })
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message })
    }
  }

  if (req.method === 'POST') {
    try {
      const { userId, amount, transactionType, description } = req.body
      if (!userId || !amount || !transactionType) {
        return res.status(400).json({ success: false, error: 'userId, amount, transactionType required' })
      }

      const { data: current, error: fetchError } = await supabase
        .from('user_coins')
        .select('coins')
        .eq('user_id', userId)
        .single()

      if (fetchError || !current) {
        return res.status(404).json({ success: false, error: '유저 정보를 찾을 수 없습니다' })
      }

      const newBalance = current.coins - amount
      if (newBalance < 0) {
        return res.status(402).json({ success: false, error: '코인이 부족합니다', coins: current.coins, required: amount })
      }

      await supabase.from('user_coins')
        .update({ coins: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', userId)

      await supabase.from('coin_transactions').insert({
        user_id: userId,
        amount: -amount,
        balance_after: newBalance,
        transaction_type: transactionType,
        description: description || `${transactionType} 코인 사용`,
      })

      return res.status(200).json({ success: true, coins: newBalance, deducted: amount })
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
