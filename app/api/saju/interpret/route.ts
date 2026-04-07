import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(req: Request) {
  try {
    const { prompt, mode } = await req.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY not configured' },
        { status: 500 },
      )
    }

    const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const userPrompt = mode === 'chat'
      ? prompt
      : `다음 사주팔자를 분석하고 해석해주세요.\n\n${prompt}`

    const result = await model.generateContent(SYSTEM_PROMPT + '\n\n' + userPrompt)

    const text = result.response.text()

    return NextResponse.json({
      success: true,
      interpretation: text,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    )
  }
}
