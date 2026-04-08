/**
 * POST /api/coins/share-bonus — 사주 결과 공유 시 2코인 보너스
 *
 * Body: { userId: string }
 * 하루 1회만 가능
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase not configured')
  return createClient(url, key)
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId required' },
        { status: 400, headers: corsHeaders },
      )
    }

    const supabase = getSupabase()

    // 오늘 이미 공유 보너스를 받았는지 체크
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const { data: todayBonus } = await supabase
      .from('coin_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('transaction_type', 'share_bonus')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .limit(1)

    if (todayBonus && todayBonus.length > 0) {
      return NextResponse.json(
        { success: false, error: '오늘은 이미 공유 보너스를 받았습니다', alreadyClaimed: true },
        { status: 409, headers: corsHeaders },
      )
    }

    // 현재 잔액 조회
    const { data: current } = await supabase
      .from('user_coins')
      .select('coins')
      .eq('user_id', userId)
      .single()

    if (!current) {
      return NextResponse.json(
        { success: false, error: '유저 정보를 찾을 수 없습니다' },
        { status: 404, headers: corsHeaders },
      )
    }

    const bonus = 2
    const newBalance = current.coins + bonus

    // 코인 지급
    await supabase
      .from('user_coins')
      .update({ coins: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    // 거래 기록
    await supabase.from('coin_transactions').insert({
      user_id: userId,
      amount: bonus,
      balance_after: newBalance,
      transaction_type: 'share_bonus',
      description: '사주 결과 공유 보너스 +2코인',
    })

    return NextResponse.json(
      { success: true, bonus, coins: newBalance, message: '공유 보너스 2코인이 지급되었습니다!' },
      { headers: corsHeaders },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500, headers: corsHeaders },
    )
  }
}
