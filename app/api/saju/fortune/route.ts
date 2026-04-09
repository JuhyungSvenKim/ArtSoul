import { NextResponse } from 'next/server'
import OpenAI from 'openai'
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
  weekly: 1,
  monthly: 1,
  yearly: 3,
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

  return `당신은 자평명리 1급 전문가이자 대한민국 1류 방송작가 출신 운세 AI입니다.

## 스타일
- 직설적, 유머러스, 촌철살인. 읽는 순간 캡처하고 싶은 운세.
- "친한 형/언니가 사주 봐주는 느낌" — 전문적이되 딱딱하지 않게.
- 뻔한 위로 절대 금지. 구체적 행동 지침을 제시.
- 비유를 잘 써라: "오늘 재물운이 좋습니다" ❌ → "오늘 지갑이 살짝 웃고 있어요. 점심에 긁은 복권, 한 장 정도는 괜찮습니다." ✅

## 분석
- ${periodContext[type]}
- 사주 원국 일간 기준 현재 간지와의 생극제화 분석
- 주별 신살 영향 보조 반영
- 대운·세운 흐름 반영

## 응답 형식 (반드시 유효한 JSON만! 마크다운/설명 텍스트 포함 금지)
{
  "title": "${label}",
  "hook": "후킹 한줄 (예: '오늘, 입 조심하세요. 진심으로.')",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "overall": "종합 운세 (2~3문장, 읽으면 '아 그래서 오늘 이랬구나' 싶은)",
  "categories": {
    "wealth": { "score": 1~5, "text": "재물 — 직설 스타일 (2~3문장)" },
    "love": { "score": 1~5, "text": "애정 — 연애/관계 리딩 (2~3문장)" },
    "career": { "score": 1~5, "text": "일/공부 — 커리어 포인트 (2~3문장)" },
    "health": { "score": 1~5, "text": "건강 — 컨디션 주의점 (1~2문장)" }
  },
  "caution": "주의사항 — 구체적으로 (예: '오후 3시~5시 사이 중요한 결정 피하세요')",
  "lucky": {
    "color": "색상 + 왜 이 색인지 한마디",
    "direction": "방향",
    "number": 숫자,
    "action": "구체적 행운 부스터 행동 (예: '초록색 음료 한 잔')"
  },
  "quote": "캡처각인 명언 한마디 (배경화면에 놓고 싶은 수준)"
}

## 절대 규칙
1. 유효한 JSON만. 마크다운/설명 텍스트 포함 시 실격.
2. 모든 텍스트가 "읽는 재미" 있어야 함. 교과서 금지.
3. score는 1(최악)~5(최고) 정수.
4. 부정적 내용 = 반드시 "대신 이렇게 하세요"까지 세트.
5. 애매한 표현 ("~할 수도 있습니다") 사용 금지. 단정적으로.`
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OPENAI_API_KEY not configured' },
        { status: 500, headers: corsHeaders },
      )
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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

    const systemPrompt = getFortunePrompt(type)
    const userMessage = `${dateContext}\n\n${aiPrompt}`

    const result = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.8,
      max_tokens: 3000,
    })
    let text = result.choices[0]?.message?.content || ''

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
