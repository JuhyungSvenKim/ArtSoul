/**
 * POST /api/payments/confirm — 토스페이먼츠 결제 승인
 *
 * 클라이언트에서 결제 완료 후:
 * Body: { paymentKey, orderId, amount, userId }
 *
 * 서버에서:
 * 1. 토스 API로 결제 승인 요청
 * 2. 결제 금액 검증
 * 3. 코인 지급
 * 4. 거래 기록
 */
import { NextResponse } from 'next/server'
import { TOSS_CONFIG } from '@/lib/payments'
import { getSupabaseServer } from '@/lib/supabase'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(req: Request) {
  try {
    const { paymentKey, orderId, amount, userId } = await req.json()

    if (!paymentKey || !orderId || !amount || !userId) {
      return NextResponse.json(
        { success: false, error: 'paymentKey, orderId, amount, userId 필수' },
        { status: 400, headers: corsHeaders },
      )
    }

    const supabase = getSupabaseServer()

    // 1) 주문 레코드 확인
    const { data: order } = await supabase
      .from('payment_records')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (!order) {
      return NextResponse.json(
        { success: false, error: '주문을 찾을 수 없습니다' },
        { status: 404, headers: corsHeaders },
      )
    }

    if (order.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: '이미 처리된 주문입니다' },
        { status: 409, headers: corsHeaders },
      )
    }

    // 금액 검증
    if (order.amount !== amount) {
      await supabase.from('payment_records').update({
        status: 'failed',
        error_message: `금액 불일치: 요청 ${amount} vs 주문 ${order.amount}`,
      }).eq('order_id', orderId)

      return NextResponse.json(
        { success: false, error: '결제 금액이 일치하지 않습니다' },
        { status: 400, headers: corsHeaders },
      )
    }

    // 2) 토스페이먼츠 결제 승인 API 호출
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
      // 결제 실패
      await supabase.from('payment_records').update({
        status: 'failed',
        payment_key: paymentKey,
        toss_response: tossData,
        error_message: tossData.message || '결제 승인 실패',
      }).eq('order_id', orderId)

      return NextResponse.json({
        success: false,
        error: tossData.message || '결제 승인에 실패했습니다',
        code: tossData.code,
      }, { status: 400, headers: corsHeaders })
    }

    // 3) 결제 성공 — 코인 지급
    const totalCoins = order.coins_purchased + order.bonus_coins

    // 현재 잔액 조회
    const { data: userCoins } = await supabase
      .from('user_coins')
      .select('coins')
      .eq('user_id', userId)
      .single()

    const currentCoins = userCoins?.coins ?? 0
    const newBalance = currentCoins + totalCoins

    // 코인 업데이트
    await supabase.from('user_coins').upsert({
      user_id: userId,
      coins: newBalance,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    // 거래 기록
    await supabase.from('coin_transactions').insert({
      user_id: userId,
      amount: totalCoins,
      balance_after: newBalance,
      transaction_type: 'charge',
      description: `코인 충전 ${order.coins_purchased}개 + 보너스 ${order.bonus_coins}개 (${order.amount.toLocaleString()}원)`,
    })

    // 주문 상태 업데이트
    await supabase.from('payment_records').update({
      status: 'confirmed',
      payment_key: paymentKey,
      toss_response: tossData,
      confirmed_at: new Date().toISOString(),
    }).eq('order_id', orderId)

    return NextResponse.json({
      success: true,
      coins: newBalance,
      charged: totalCoins,
      message: `${totalCoins}코인이 충전되었습니다!`,
    }, { headers: corsHeaders })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders },
    )
  }
}
