import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
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

type FortuneType = 'today' | 'weekly' | 'monthly' | 'yearly'

const FORTUNE_COSTS: Record<FortuneType, number> = {
  today: 1,
  weekly: 3,
  monthly: 5,
  yearly: 10,
}

const FORTUNE_LABELS: Record<FortuneType, string> = {
  today: '오늘의 운세',
  weekly: '금주의 운세',
  monthly: '이번 달 운세',
  yearly: '올해의 운세',
}

function getFortunePrompt(type: FortuneType): string {
  const label = FORTUNE_LABELS[type]

  const periodContext: Record<FortuneType, string> = {
    today: '오늘 하루의 일진(일간지)과 사주 원국의 상호작용을 분석합니다.',
    weekly: '이번 주 7일간의 일진 흐름과 사주 원국의 상호작용을 분석합니다.',
    monthly: '이번 달의 월운(월간지)과 사주 원국의 상호작용을 분석합니다.',
    yearly: '올해의 세운(년간지)과 사주 원국의 상호작용을 종합 분석합니다.',
  }

  return `당신은 ArtSoul의 사주 전문 AI입니다.
사용자의 사주팔자 데이터를 기반으로 **${label}**를 생성합니다.

## 분석 방법
- ${periodContext[type]}
- 사주 원국의 일간을 기준으로 현재 시점의 간지와의 생극제화 관계를 분석
- 각 주(연주/월주/일주/시주)에 배치된 신살이 해당 시기에 미치는 영향을 해석
- 대운·세운의 흐름을 반영하여 현재 시점의 에너지를 판단

## 응답 형식 (JSON)
{
  "title": "${label}",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "overall": "종합 운세 (2~3문장)",
  "categories": {
    "wealth": { "score": 1~5, "text": "재물운 해석" },
    "love": { "score": 1~5, "text": "애정운 해석" },
    "career": { "score": 1~5, "text": "직장/학업운 해석" },
    "health": { "score": 1~5, "text": "건강운 해석" }
  },
  "caution": "주의사항",
  "lucky": {
    "color": "행운의 색상",
    "direction": "행운의 방향",
    "number": 행운의 숫자
  },
  "advice": "오늘의 한마디 조언"
}

## 규칙
1. 반드시 유효한 JSON으로만 응답하세요. 마크다운이나 설명 텍스트를 포함하지 마세요.
2. 한국어로 친근하고 이해하기 쉽게 작성합니다.
3. 부정적인 내용은 긍정적 조언과 함께 전달합니다.
4. 신살이 해당 주에 미치는 구체적 영향을 설명에 반영합니다.
5. score는 1(매우 나쁨)~5(매우 좋음) 정수입니다.`
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { fortuneType, year, month, day, hour, gender, calendarType } = body

    if (!fortuneType || !FORTUNE_COSTS[fortuneType as FortuneType]) {
      return NextResponse.json(
        { success: false, error: 'Invalid fortuneType. Use: today, weekly, monthly, yearly' },
        { status: 400, headers: corsHeaders },
      )
    }

    const type = fortuneType as FortuneType
    const cost = FORTUNE_COSTS[type]

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY not configured' },
        { status: 500, headers: corsHeaders },
      )
    }

    // 사주 계산
    const input: SajuInput = {
      year, month, day, hour,
      gender: gender || '남',
      calendarType: calendarType || '양력',
    }
    const sajuResult = getSaju(input)
    const aiPrompt = sajuToAIPrompt(sajuResult)

    // 현재 날짜 정보 추가
    const now = new Date()
    const dateContext = `현재 날짜: ${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`

    const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const systemPrompt = getFortunePrompt(type)
    const userMessage = `${dateContext}\n\n${aiPrompt}`

    const result = await model.generateContent(systemPrompt + '\n\n' + userMessage)
    let text = result.response.text()

    // JSON 파싱 시도 (마크다운 코드블록 제거)
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let fortune: unknown
    try {
      fortune = JSON.parse(text)
    } catch {
      // JSON 파싱 실패시 텍스트로 반환
      fortune = { raw: text }
    }

    return NextResponse.json(
      {
        success: true,
        fortuneType: type,
        cost,
        label: FORTUNE_LABELS[type],
        fortune,
      },
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
