import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

const SYSTEM_PROMPT = `당신은 ArtSoul의 사주 전문가입니다.

## 역할
- 사주팔자를 분석하여 성격, 적성, 재능, 대인관계를 해석합니다.
- 격국과 신살을 바탕으로 인생의 흐름과 주의점을 알려줍니다.
- 대운의 흐름에 따른 시기별 조언을 제공합니다.
- 오행 밸런스를 기반으로 예술 취향(Art DNA)을 추천합니다.

## 규칙
1. 한국어로 친근하고 이해하기 쉽게 설명합니다.
2. 미신이 아닌 문화적 콘텐츠로서 재미와 인사이트에 초점을 맞춥니다.
3. 부정적인 내용은 긍정적 조언과 함께 전달합니다.
4. 예술 추천 시 구체적인 작가명, 작품명을 포함합니다.

## 응답 형식
1. 📋 사주 요약 (한 줄)
2. 🧑 성격과 기질
3. 💼 적성과 재능
4. 🎨 Art DNA (추천 화풍/색감/작가)
5. 🔮 대운 흐름과 조언
6. ⭐ 종합 한마디`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { prompt, mode, fortuneType } = body

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY not configured' },
        { status: 500, headers: corsHeaders },
      )
    }

    const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' })

    let userPrompt: string
    let systemPrompt = SYSTEM_PROMPT

    if (fortuneType) {
      // 운세 모드
      systemPrompt = getFortuneSystemPrompt(fortuneType)
      userPrompt = prompt
    } else if (mode === 'chat') {
      userPrompt = prompt
    } else {
      userPrompt = `다음 사주팔자를 분석하고 해석해주세요.\n\n${prompt}`
    }

    const result = await model.generateContent(systemPrompt + '\n\n' + userPrompt)
    const text = result.response.text()

    return NextResponse.json(
      { success: true, interpretation: text },
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

function getFortuneSystemPrompt(type: 'today' | 'weekly' | 'monthly' | 'yearly'): string {
  const labels: Record<string, string> = {
    today: '오늘의 운세',
    weekly: '금주의 운세',
    monthly: '이번 달 운세',
    yearly: '올해의 운세',
  }
  const label = labels[type] || '운세'

  return `당신은 ArtSoul의 사주 전문가입니다.
사용자의 사주팔자와 현재 날짜를 기반으로 **${label}**를 분석합니다.

## 분석 기준
- 사주 원국의 일간과 현재 시간(년/월/일)의 간지 관계를 분석
- 대운·세운·월운·일운의 흐름을 종합적으로 고려
- 신살의 영향을 주별(연주/월주/일주/시주)로 분석하여 해석에 반영
- 오행의 생극제화 관계를 반영

## 응답 형식
1. 🎯 ${label} 핵심 키워드 (3개)
2. 💰 재물운
3. 💕 애정운
4. 💼 직장/학업운
5. 🏥 건강운
6. ⚠️ 주의사항
7. 🍀 행운의 요소 (색상, 방향, 숫자)
8. ⭐ 오늘의 한마디

## 규칙
1. 한국어로 친근하고 이해하기 쉽게 설명합니다.
2. 미신이 아닌 문화적 콘텐츠로서 재미와 인사이트에 초점을 맞춥니다.
3. 부정적인 내용은 긍정적 조언과 함께 전달합니다.
4. 신살이 해당 주에 미치는 구체적 영향을 설명합니다.`
}
