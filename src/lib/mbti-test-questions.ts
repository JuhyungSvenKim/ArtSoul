/**
 * MBTI 정밀 테스트 — 48문항, 7점 척도, 차원별 강도 측정
 * 16personalities 스타일
 */

export interface MbtiQuestion {
  id: number
  text: string
  /** 이 문항이 측정하는 차원 */
  dimension: 'EI' | 'SN' | 'TF' | 'JP'
  /** true면 "그렇다"가 앞쪽(E,S,T,J), false면 "그렇다"가 뒤쪽(I,N,F,P) */
  forward: boolean
}

// 7점 척도: 1=매우 아니다, 2=아니다, 3=약간 아니다, 4=보통, 5=약간 그렇다, 6=그렇다, 7=매우 그렇다
export const LIKERT_LABELS = [
  '매우 아니다', '아니다', '약간 아니다', '보통', '약간 그렇다', '그렇다', '매우 그렇다',
] as const

export const MBTI_QUESTIONS: MbtiQuestion[] = [
  // ═══════════════════════════════════════════
  // E/I 차원 (12문항) — 외향 vs 내향
  // ═══════════════════════════════════════════
  { id: 1, dimension: 'EI', forward: true,
    text: '모르는 사람들이 많은 모임에서도 자연스럽게 대화를 시작하는 편이다' },
  { id: 2, dimension: 'EI', forward: false,
    text: '혼자 미술관을 돌아보는 게 누군가와 함께 가는 것보다 편하다' },
  { id: 3, dimension: 'EI', forward: true,
    text: '여러 사람과 아이디어를 나눌 때 에너지가 올라가는 걸 느낀다' },
  { id: 4, dimension: 'EI', forward: false,
    text: '사람이 많은 전시회보다 조용한 갤러리가 훨씬 좋다' },
  { id: 5, dimension: 'EI', forward: true,
    text: '파티나 행사에 가면 새로운 사람을 적극적으로 만난다' },
  { id: 6, dimension: 'EI', forward: false,
    text: '주말에 약속 없이 혼자 보내는 시간이 가장 충전되는 느낌이다' },
  { id: 7, dimension: 'EI', forward: true,
    text: '그림을 볼 때 옆 사람과 감상을 나누는 게 즐겁다' },
  { id: 8, dimension: 'EI', forward: false,
    text: '깊이 생각할 때는 혼자 조용한 환경이 필수적이다' },
  { id: 9, dimension: 'EI', forward: true,
    text: '활기차고 사람 많은 공간에서 일할 때 집중이 더 잘 된다' },
  { id: 10, dimension: 'EI', forward: false,
    text: '소수의 가까운 사람과 깊은 대화를 나누는 게 많은 사람과 어울리는 것보다 낫다' },
  { id: 11, dimension: 'EI', forward: true,
    text: '생각을 말로 표현하면서 정리하는 편이다' },
  { id: 12, dimension: 'EI', forward: false,
    text: '머릿속으로 충분히 정리한 후에 말하는 걸 선호한다' },

  // ═══════════════════════════════════════════
  // S/N 차원 (12문항) — 감각 vs 직관
  // ═══════════════════════════════════════════
  { id: 13, dimension: 'SN', forward: true,
    text: '그림을 볼 때 색감, 질감, 붓터치 같은 구체적인 디테일에 먼저 눈이 간다' },
  { id: 14, dimension: 'SN', forward: false,
    text: '그림 뒤에 숨겨진 의미나 상징을 찾는 게 재미있다' },
  { id: 15, dimension: 'SN', forward: true,
    text: '추상적인 아이디어보다 눈에 보이는 현실적인 것을 더 신뢰한다' },
  { id: 16, dimension: 'SN', forward: false,
    text: '아직 존재하지 않는 가능성에 대해 상상하는 걸 좋아한다' },
  { id: 17, dimension: 'SN', forward: true,
    text: '단계별 매뉴얼이나 레시피를 정확히 따르는 게 편하다' },
  { id: 18, dimension: 'SN', forward: false,
    text: '규칙이나 전례 없이 새로운 방식을 시도하는 게 설렌다' },
  { id: 19, dimension: 'SN', forward: true,
    text: '사실적인 풍경화나 정밀한 묘사가 있는 작품이 끌린다' },
  { id: 20, dimension: 'SN', forward: false,
    text: '몽환적이거나 초현실적인 분위기의 작품에 매력을 느낀다' },
  { id: 21, dimension: 'SN', forward: true,
    text: '경험해본 것 중심으로 판단하는 편이다' },
  { id: 22, dimension: 'SN', forward: false,
    text: '패턴이나 연결고리를 찾아내는 직감이 강한 편이다' },
  { id: 23, dimension: 'SN', forward: true,
    text: '실용적이고 쓸모 있는 물건에 돈 쓰는 게 합리적이라고 생각한다' },
  { id: 24, dimension: 'SN', forward: false,
    text: '영감을 주는 것에는 실용성이 없어도 가치가 있다고 느낀다' },

  // ═══════════════════════════════════════════
  // T/F 차원 (12문항) — 사고 vs 감정
  // ═══════════════════════════════════════════
  { id: 25, dimension: 'TF', forward: true,
    text: '결정할 때 감정보다 논리와 근거를 우선시한다' },
  { id: 26, dimension: 'TF', forward: false,
    text: '그림을 고를 때 분석보다 "마음이 끌리는" 느낌을 따른다' },
  { id: 27, dimension: 'TF', forward: true,
    text: '솔직한 비판이 거짓 칭찬보다 도움이 된다고 생각한다' },
  { id: 28, dimension: 'TF', forward: false,
    text: '상대방의 기분을 상하게 할 바에는 돌려 말하는 게 낫다' },
  { id: 29, dimension: 'TF', forward: true,
    text: '작품의 기술적 완성도가 감정적 호소력보다 중요하다' },
  { id: 30, dimension: 'TF', forward: false,
    text: '기술적으로 부족해도 감동을 주는 작품이 더 좋은 작품이다' },
  { id: 31, dimension: 'TF', forward: true,
    text: '공정함과 원칙을 지키는 게 조화보다 중요하다' },
  { id: 32, dimension: 'TF', forward: false,
    text: '관계의 조화를 위해 원칙을 양보할 수 있다' },
  { id: 33, dimension: 'TF', forward: true,
    text: '문제가 생기면 원인 분석부터 하는 편이다' },
  { id: 34, dimension: 'TF', forward: false,
    text: '문제가 생기면 관련된 사람들의 감정부터 살피는 편이다' },
  { id: 35, dimension: 'TF', forward: true,
    text: '감정에 휘둘리지 않고 객관적으로 판단하는 게 중요하다' },
  { id: 36, dimension: 'TF', forward: false,
    text: '머리로는 아닌데 마음이 시키는 대로 할 때가 종종 있다' },

  // ═══════════════════════════════════════════
  // J/P 차원 (12문항) — 판단 vs 인식
  // ═══════════════════════════════════════════
  { id: 37, dimension: 'JP', forward: true,
    text: '일정이 정해져 있으면 마음이 편하다' },
  { id: 38, dimension: 'JP', forward: false,
    text: '계획을 세우기보다 그때그때 흐름에 맡기는 게 좋다' },
  { id: 39, dimension: 'JP', forward: true,
    text: '할 일 목록을 만들고 하나씩 지워나가는 게 뿌듯하다' },
  { id: 40, dimension: 'JP', forward: false,
    text: '마감 직전에 몰아서 하는 편인데, 그때 집중이 가장 잘 된다' },
  { id: 41, dimension: 'JP', forward: true,
    text: '방이나 작업 공간이 깔끔하게 정리되어 있어야 한다' },
  { id: 42, dimension: 'JP', forward: false,
    text: '약간 어지러운 환경이 오히려 창의적 자극이 된다' },
  { id: 43, dimension: 'JP', forward: true,
    text: '결정을 빨리 내리고 실행하는 게 편하다' },
  { id: 44, dimension: 'JP', forward: false,
    text: '선택지를 오래 열어두고 최대한 많은 가능성을 탐색하고 싶다' },
  { id: 45, dimension: 'JP', forward: true,
    text: '예상치 못한 변화가 생기면 스트레스를 받는다' },
  { id: 46, dimension: 'JP', forward: false,
    text: '예상 못한 상황이 오히려 재미있고 흥분된다' },
  { id: 47, dimension: 'JP', forward: true,
    text: '여행 전에 숙소, 일정, 맛집을 미리 다 정해놓는 편이다' },
  { id: 48, dimension: 'JP', forward: false,
    text: '여행은 계획 없이 떠나야 진짜 여행이다' },
]

// ── 차원별 강도 계산 ────────────────────────────
export interface MbtiDimensionScore {
  E: number; I: number  // 0~100 합 = 100
  S: number; N: number
  T: number; F: number
  J: number; P: number
}

export interface MbtiTestResult {
  type: string           // "ENFP" 등
  scores: MbtiDimensionScore
  /** 각 차원의 주도 비율 (0.5~1.0) */
  strengths: { EI: number; SN: number; TF: number; JP: number }
}

/**
 * 응답(1~7)에서 MBTI 결과 계산
 * @param answers - { [questionId]: 1~7 }
 */
export function calculateMbtiResult(answers: Record<number, number>): MbtiTestResult {
  const dimScores: Record<string, { forward: number; reverse: number; count: number }> = {
    EI: { forward: 0, reverse: 0, count: 0 },
    SN: { forward: 0, reverse: 0, count: 0 },
    TF: { forward: 0, reverse: 0, count: 0 },
    JP: { forward: 0, reverse: 0, count: 0 },
  }

  for (const q of MBTI_QUESTIONS) {
    const val = answers[q.id]
    if (val === undefined) continue

    const dim = dimScores[q.dimension]
    dim.count++

    if (q.forward) {
      // 높은 점수 = 앞쪽(E,S,T,J) 강함
      dim.forward += val
    } else {
      // 높은 점수 = 뒤쪽(I,N,F,P) 강함
      dim.reverse += val
    }
  }

  function calcPercent(dim: { forward: number; reverse: number; count: number }): [number, number] {
    if (dim.count === 0) return [50, 50]
    const maxPossible = dim.count * 7 / 2 // 한쪽 최대 (forward 6문항 × 7 = 42)
    const fwdNorm = dim.forward / (dim.count / 2 * 7) // 0~1
    const revNorm = dim.reverse / (dim.count / 2 * 7) // 0~1
    const total = fwdNorm + revNorm || 1
    const fwdPct = Math.round((fwdNorm / total) * 100)
    return [fwdPct, 100 - fwdPct]
  }

  const [E, I] = calcPercent(dimScores.EI)
  const [S, N] = calcPercent(dimScores.SN)
  const [T, F] = calcPercent(dimScores.TF)
  const [J, P] = calcPercent(dimScores.JP)

  const type = `${E >= 50 ? 'E' : 'I'}${S >= 50 ? 'S' : 'N'}${T >= 50 ? 'T' : 'F'}${J >= 50 ? 'J' : 'P'}`

  return {
    type,
    scores: { E, I, S, N, T, F, J, P },
    strengths: {
      EI: Math.max(E, I) / 100,
      SN: Math.max(S, N) / 100,
      TF: Math.max(T, F) / 100,
      JP: Math.max(J, P) / 100,
    },
  }
}

/** 문항 순서 셔플 (매번 다른 순서) */
export function shuffleQuestions(): MbtiQuestion[] {
  const arr = [...MBTI_QUESTIONS]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
