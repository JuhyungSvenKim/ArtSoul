import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

// GET: 코인 잔액 조회
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId required' },
        { status: 400, headers: corsHeaders },
      )
    }

    const supabase = getSupabase()

    // 유저 코인 조회 (없으면 자동 생성)
    let { data, error } = await supabase
      .from('user_coins')
      .select('coins')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // 신규 유저 → 기본 10코인 지급
      const { data: newData, error: insertError } = await supabase
        .from('user_coins')
        .insert({ user_id: userId, coins: 10 })
        .select('coins')
        .single()

      if (insertError) {
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500, headers: corsHeaders },
        )
      }

      // 가입 보너스 기록
      await supabase.from('coin_transactions').insert({
        user_id: userId,
        amount: 10,
        balance_after: 10,
        transaction_type: 'signup_bonus',
        description: '가입 축하 보너스 10코인',
      })

      data = newData
    }

    return NextResponse.json(
      { success: true, coins: data!.coins },
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

// POST: 코인 차감
export async function POST(req: Request) {
  try {
    const { userId, amount, transactionType, description } = await req.json()

    if (!userId || !amount || !transactionType) {
      return NextResponse.json(
        { success: false, error: 'userId, amount, transactionType required' },
        { status: 400, headers: corsHeaders },
      )
    }

    const supabase = getSupabase()

    // 현재 잔액 조회
    const { data: current, error: fetchError } = await supabase
      .from('user_coins')
      .select('coins')
      .eq('user_id', userId)
      .single()

    if (fetchError || !current) {
      return NextResponse.json(
        { success: false, error: '유저 정보를 찾을 수 없습니다' },
        { status: 404, headers: corsHeaders },
      )
    }

    const newBalance = current.coins - amount

    if (newBalance < 0) {
      return NextResponse.json(
        { success: false, error: '코인이 부족합니다', coins: current.coins, required: amount },
        { status: 402, headers: corsHeaders },
      )
    }

    // 코인 차감
    const { error: updateError } = await supabase
      .from('user_coins')
      .update({ coins: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500, headers: corsHeaders },
      )
    }

    // 거래 기록
    await supabase.from('coin_transactions').insert({
      user_id: userId,
      amount: -amount,
      balance_after: newBalance,
      transaction_type: transactionType,
      description: description || `${transactionType} 코인 사용`,
    })

    return NextResponse.json(
      { success: true, coins: newBalance, deducted: amount },
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
