/**
 * POST /api/payments/prepare — 결제 준비 (주문 생성)
 *
 * Body: { userId, packageId }
 * Returns: { orderId, amount, orderName, ... }
 */
import { NextResponse } from 'next/server'
import { generateOrderId, DEFAULT_PACKAGES } from '@/lib/payments'
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
    const { userId, packageId } = await req.json()

    if (!userId || !packageId) {
      return NextResponse.json(
        { success: false, error: 'userId, packageId 필수' },
        { status: 400, headers: corsHeaders },
      )
    }

    const supabase = getSupabaseServer()

    // 패키지 조회
    let pkg: typeof DEFAULT_PACKAGES[0] | null = null

    const { data: dbPkg } = await supabase
      .from('coin_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single()

    if (dbPkg) {
      pkg = dbPkg
    } else {
      pkg = DEFAULT_PACKAGES.find(p => p.id === packageId) || null
    }

    if (!pkg) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 패키지입니다' },
        { status: 404, headers: corsHeaders },
      )
    }

    // 주문 생성
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

    return NextResponse.json({
      success: true,
      orderId,
      amount: pkg.price,
      orderName,
      package: {
        name: pkg.name,
        coins: pkg.coins,
        bonus_coins: pkg.bonus_coins,
        price: pkg.price,
      },
    }, { headers: corsHeaders })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders },
    )
  }
}
