import { NextResponse } from 'next/server'
import { getSaju, sajuToAIPrompt, sajuToDBRecord } from '@/lib/saju'
import type { SajuInput } from '@/lib/saju'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
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

    return NextResponse.json({
      success: true,
      data: result,
      aiPrompt,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 400 },
    )
  }
}
