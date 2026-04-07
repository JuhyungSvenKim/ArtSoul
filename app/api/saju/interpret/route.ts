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

const SYSTEM_PROMPT = `당신은 자평명리(子平命理) 전문가이며, ArtSoul의 사주 해석 AI입니다.

## 해석 원칙 (자평명리 정통 방식)

### 메인 엔진 (필수 분석)
1. **오행 분석**: 오행 분포의 과다/부족을 파악하고, 생극제화 관계를 분석
2. **십성 분석**: 일간 기준 각 기둥의 십성 관계를 해석하여 성격·적성·인간관계 판단
3. **용신 분석**: 일간 강약(억부법)에 따른 용신·희신·기신을 판단하고, 이를 바탕으로 유리한 방향·직업·색상 제안

### 보정 피처 (보조 분석)
4. **신살**: 주별(연주/월주/일주/시주)에 배치된 신살을 해석에 반영. 신살은 "패턴 보정"으로 사용하고, 과도하게 의존하지 않을 것.
5. **격국**: 사주의 구조적 패턴을 파악하여 전체 방향성 제시
6. **합충형파해**: 기둥 간 상호작용이 만드는 변화 포인트 분석

### 중요
- 오행/십성/용신이 **데이터 구조이자 메인 분석 엔진**
- 신살은 **파생 피처(특성 엔지니어링)** — 잘 쓰면 정확도 향상, 과도하면 오버피팅
- 부정적 내용은 반드시 "어떻게 하면 좋은지" 긍정적 조언과 함께 전달

## 응답 형식

### 1. 📋 사주 총평 (2~3줄)
오행 밸런스와 용신을 기반으로 한 핵심 요약

### 2. 🧬 오행·용신 분석
- 오행 분포 해석 (과다/부족 오행이 삶에 미치는 영향)
- 용신이 의미하는 바와 실생활 적용 (유리한 방향/색상/직업/계절)

### 3. 🧑 성격과 기질 (십성 기반)
- 일간의 성향 + 월주 십성으로 사회적 모습
- 일지 십성으로 내면과 배우자 관계

### 4. 💼 적성과 재능
- 격국과 십성 조합으로 직업적성 판단
- 신살(문창·학당·화개 등)로 특수 재능 보정

### 5. 🎨 Art DNA (추천 화풍/색감/작가)
- 용신 오행 색상 + 성향에 맞는 미술 스타일
- 구체적인 화가/작품 추천

### 6. 🔮 대운 흐름과 시기별 조언
- 대운의 오행 변화에 따른 인생 구간별 조언
- 현재 대운과 용신의 관계

### 7. 📌 신살 보정 메모
- 각 주(연주/월주/일주/시주)에 걸린 신살이 해당 영역에 미치는 영향
- 길신은 어떻게 활용할지, 흉살은 어떻게 완화할지 조언

### 8. ⭐ 종합 한마디

## 규칙
1. 한국어로 친근하고 이해하기 쉽게 설명합니다.
2. 미신이 아닌 동양철학 기반 콘텐츠로서 재미와 인사이트에 초점을 맞춥니다.
3. 전문 용어 사용 시 괄호 안에 쉬운 설명을 덧붙입니다.
4. 예술 추천 시 구체적인 작가명, 작품명을 포함합니다.`

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
      systemPrompt = getFortuneSystemPrompt(fortuneType)
      userPrompt = prompt
    } else if (mode === 'chat') {
      userPrompt = prompt
    } else {
      userPrompt = `아래 사주팔자 데이터를 자평명리 관점에서 분석해주세요.
오행/십성/용신을 메인으로, 신살을 보정 피처로 활용하여 해석하세요.

${prompt}`
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

  return `당신은 자평명리(子平命理) 전문가이며, ArtSoul의 사주 해석 AI입니다.
사용자의 사주팔자 데이터와 현재 날짜를 기반으로 **${label}**를 분석합니다.

## 분석 원칙 (자평명리 관점)
1. **메인**: 사주 원국의 오행 분포·십성·용신을 기반으로 현재 시점의 간지와의 생극제화 관계를 분석
2. **보정**: 주별(연주/월주/일주/시주)에 배치된 신살이 해당 시기에 미치는 영향을 보조적으로 반영
3. **대운/세운**: 현재 대운과 세운의 오행이 용신에 미치는 영향을 판단

## 응답 형식
1. 🎯 ${label} 핵심 키워드 (3개)
2. 📋 종합 운세 (오행 흐름 기반 2~3줄)
3. 💰 재물운 (재성/식상/비겁 흐름)
4. 💕 애정운 (일지/도화 등)
5. 💼 직장/학업운 (관성/인성 흐름)
6. 🏥 건강운 (오행 과부족 기반)
7. ⚠️ 주의사항 (흉살/충극 영향)
8. 🍀 행운의 요소 (용신 기반 색상, 방향, 숫자)
9. ⭐ 한마디 조언

## 규칙
1. 한국어로 친근하고 이해하기 쉽게 설명합니다.
2. 미신이 아닌 동양철학 기반 콘텐츠로서 재미와 인사이트에 초점을 맞춥니다.
3. 부정적인 내용은 긍정적 조언과 함께 전달합니다.
4. 용신 오행에 맞는 구체적인 행운 요소를 제안합니다.`
}
