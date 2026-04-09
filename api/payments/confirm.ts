import type { VercelRequest, VercelResponse } from '@vercel/node'
import { TOSS_CONFIG } from '../_lib/payments'
import { getSupabase } from '../_lib/supabase'
import { setCors } from '../_lib/cors'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { paymentKey, orderId, amount, userId } = req.body

    if (!paymentKey || !orderId || !amount || !userId) {
      return res.status(400).json({ success: false, error: 'paymentKey, orderId, amount, userId 필수' })
    }

    const supabase = getSupabase()

    const { data: order } = await supabase
      .from('payment_records')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (!order) {
      return res.status(404).json({ success: false, error: '주문을 찾을 수 없습니다' })
    }

    if (order.status !== 'pending') {
      return res.status(409).json({ success: false, error: '이미 처리된 주문입니다' })
    }

    if (order.amount !== amount) {
      await supabase.from('payment_records').update({
        status: 'failed',
        error_message: `금액 불일치: 요청 ${amount} vs 주문 ${order.amount}`,
      }).eq('order_id', orderId)
      return res.status(400).json({ success: false, error: '결제 금액이 일치하지 않습니다' })
    }

    // 토스페이먼츠 결제 승인
    const basicAuth = Buffer.from(`${TOSS_CONFIG.secretKey}:`).toString('base64')
    const tossRes = await fetch(TOSS_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })

    const tossData = await tossRes.json()

    if (!tossRes.ok) {
      await supabase.from('payment_records').update({
        status: 'failed',
        payment_key: paymentKey,
        toss_response: tossData,
        error_message: tossData.message || '결제 승인 실패',
      }).eq('order_id', orderId)
      return res.status(400).json({
        success: false,
        error: tossData.message || '결제 승인에 실패했습니다',
        code: tossData.code,
      })
    }

    // 코인 지급
    const totalCoins = order.coins_purchased + order.bonus_coins
    const { data: userCoins } = await supabase
      .from('user_coins')
      .select('coins')
      .eq('user_id', userId)
      .single()

    const currentCoins = userCoins?.coins ?? 0
    const newBalance = currentCoins + totalCoins

    await supabase.from('user_coins').upsert({
      user_id: userId,
      coins: newBalance,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    await supabase.from('coin_transactions').insert({
      user_id: userId,
      amount: totalCoins,
      balance_after: newBalance,
      transaction_type: 'charge',
      description: `코인 충전 ${order.coins_purchased}개 + 보너스 ${order.bonus_coins}개 (${order.amount.toLocaleString()}원)`,
    })

    await supabase.from('payment_records').update({
      status: 'confirmed',
      payment_key: paymentKey,
      toss_response: tossData,
      confirmed_at: new Date().toISOString(),
    }).eq('order_id', orderId)

    return res.status(200).json({
      success: true,
      coins: newBalance,
      charged: totalCoins,
      message: `${totalCoins}코인이 충전되었습니다!`,
    })
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message })
  }
}
