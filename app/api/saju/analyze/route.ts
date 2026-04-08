import { NextResponse } from 'next/server'
import { getSaju, sajuToAIPrompt } from '@/lib/saju'
import type { SajuInput } from '@/lib/saju'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const input: SajuInput = {
      year: body.year,
      month: body.month,
      day: body.day,
      hour: body.hour,
      gender: body.gender,
      calendarType: body.calendarType || '양력',
    }

    const result = getSaju(input)
    const aiPrompt = sajuToAIPrompt(result)

    return NextResponse.json(
      {
        success: true,
        data: result,
        aiPrompt,
        costs: {
          interpret: 2,      // AI 사주 해석: 2코인
          fortune_today: 1,   // 일간 운세: 1코인
          fortune_weekly: 1,  // 주간 운세: 1코인
          fortune_monthly: 1, // 월간 운세: 1코인
          fortune_yearly: 3,  // 년간 운세: 3코인
        },
      },
      { headers: corsHeaders },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 400, headers: corsHeaders },
    )
  }
}
