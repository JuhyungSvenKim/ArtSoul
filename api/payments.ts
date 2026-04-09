import type { VercelRequest, VercelResponse } from '@vercel/node'
import { TOSS_CONFIG, generateOrderId, DEFAULT_PACKAGES } from './_lib/payments'
import { getSupabase } from './_lib/supabase'
import { setCors } from './_lib/cors'

/**
 * 통합 결제 API — action으로 분기
 * POST { action: "prepare", userId, packageId }
 * POST { action: "confirm", paymentKey, orderId, amount, userId }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action } = req.body
  const supabase = getSupabase()

  // ── prepare ──────────────────────────────
  if (action === 'prepare') {
    try {
      const { userId, packageId } = req.body
      if (!userId || !packageId) {
        return res.status(400).json({ success: false, error: 'userId, packageId 필수' })
      }

      let pkg: typeof DEFAULT_PACKAGES[0] | null = null
      const { data: dbPkg } = await supabase
        .from('coin_packages')
        .select('*')
        .eq('id', packageId)
        .eq('is_active', true)
        .single()

      pkg = dbPkg || DEFAULT_PACKAGES.find(p => p.id === packageId) || null
      if (!pkg) {
        return res.status(404).json({ success: false, error: '유효하지 않은 패키지입니다' })
      }

      const orderId = generateOrderId()
      const orderName = `ART.D.N.A. 코인 ${pkg.coins}개${pkg.bonus_coins > 0 ? ` (+${pkg.bonus_coins} 보너스)` : ''}`

      await supabase.from('payment_records').insert({
        user_id: userId,
        order_id: orderId,
        package_id: pkg.id,
        amount: pkg.price,
        coins_purchased: pkg.coins,
        bonus_coins: pkg.bonus_coins,
        status: 'pending',
      })

      return res.status(200).json({
        success: true, orderId, amount: pkg.price, orderName,
        package: { name: pkg.name, coins: pkg.coins, bonus_coins: pkg.bonus_coins, price: pkg.price },
      })
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message })
    }
  }

  // ── confirm ──────────────────────────────
  if (action === 'confirm') {
    try {
      const { paymentKey, orderId, amount, userId } = req.body
      if (!paymentKey || !orderId || !amount || !userId) {
        return res.status(400).json({ success: false, error: 'paymentKey, orderId, amount, userId 필수' })
      }

      const { data: order } = await supabase
        .from('payment_records')
        .select('*')
        .eq('order_id', orderId)
        .single()

      if (!order) return res.status(404).json({ success: false, error: '주문을 찾을 수 없습니다' })
      if (order.status !== 'pending') return res.status(409).json({ success: false, error: '이미 처리된 주문입니다' })
      if (order.amount !== amount) {
        await supabase.from('payment_records').update({
          status: 'failed', error_message: `금액 불일치: ${amount} vs ${order.amount}`,
        }).eq('order_id', orderId)
        return res.status(400).json({ success: false, error: '결제 금액이 일치하지 않습니다' })
      }

      // 토스페이먼츠 결제 승인
      const basicAuth = Buffer.from(`${TOSS_CONFIG.secretKey}:`).toString('base64')
      const tossRes = await fetch(TOSS_CONFIG.apiUrl, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${basicAuth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      })
      const tossData = await tossRes.json()

      if (!tossRes.ok) {
        await supabase.from('payment_records').update({
          status: 'failed', payment_key: paymentKey, toss_response: tossData,
          error_message: tossData.message || '결제 승인 실패',
        }).eq('order_id', orderId)
        return res.status(400).json({ success: false, error: tossData.message || '결제 승인 실패', code: tossData.code })
      }

      // 코인 지급
      const totalCoins = order.coins_purchased + order.bonus_coins
      const { data: userCoins } = await supabase.from('user_coins').select('coins').eq('user_id', userId).single()
      const newBalance = (userCoins?.coins ?? 0) + totalCoins

      await supabase.from('user_coins').upsert({ user_id: userId, coins: newBalance, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      await supabase.from('coin_transactions').insert({
        user_id: userId, amount: totalCoins, balance_after: newBalance,
        transaction_type: 'charge',
        description: `코인 충전 ${order.coins_purchased}개 + 보너스 ${order.bonus_coins}개 (${order.amount.toLocaleString()}원)`,
      })
      await supabase.from('payment_records').update({
        status: 'confirmed', payment_key: paymentKey, toss_response: tossData, confirmed_at: new Date().toISOString(),
      }).eq('order_id', orderId)

      return res.status(200).json({ success: true, coins: newBalance, charged: totalCoins, message: `${totalCoins}코인이 충전되었습니다!` })
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message })
    }
  }

  return res.status(400).json({ success: false, error: 'action은 prepare 또는 confirm' })
}
