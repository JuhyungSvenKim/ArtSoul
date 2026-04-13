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
    text: '처음 보는 사람한테도 먼저 말 거는 거 별로 어렵지 않음' },
  { id: 2, dimension: 'EI', forward: false,
    text: '미술관은 혼자 조용히 가야 제맛이지' },
  { id: 3, dimension: 'EI', forward: true,
    text: '사람들이랑 브레인스토밍하면 아이디어가 폭발함' },
  { id: 4, dimension: 'EI', forward: false,
    text: '핫플 전시보다 한적한 갤러리가 100배 나음' },
  { id: 5, dimension: 'EI', forward: true,
    text: '모임이나 파티에서 새로운 인연 만드는 게 즐거움' },
  { id: 6, dimension: 'EI', forward: false,
    text: '주말에 약속 없는 날이 제일 행복한 날임' },
  { id: 7, dimension: 'EI', forward: true,
    text: '그림 보면서 옆 사람이랑 "이거 좋다" "저건 별로" 하는 게 재밌음' },
  { id: 8, dimension: 'EI', forward: false,
    text: '뭔가 깊이 생각할 때는 혼자여야 함. 카페도 이어폰 필수' },
  { id: 9, dimension: 'EI', forward: true,
    text: '왁자지껄한 오피스가 오히려 집중 잘 됨' },
  { id: 10, dimension: 'EI', forward: false,
    text: '10명이랑 가볍게보다 1명이랑 깊게 대화하는 게 나음' },
  { id: 11, dimension: 'EI', forward: true,
    text: '생각을 입 밖으로 꺼내면서 정리하는 스타일임' },
  { id: 12, dimension: 'EI', forward: false,
    text: '머릿속에서 다 정리한 다음에 말하는 편' },

  // ═══════════════════════════════════════════
  // S/N 차원 (12문항) — 감각 vs 직관
  // ═══════════════════════════════════════════
  { id: 13, dimension: 'SN', forward: true,
    text: '그림 볼 때 붓터치, 색감, 질감 같은 디테일에 먼저 꽂힘' },
  { id: 14, dimension: 'SN', forward: false,
    text: '그림 속 숨겨진 의미나 떡밥 찾는 거 좋아함' },
  { id: 15, dimension: 'SN', forward: true,
    text: '뜬구름 잡는 이야기보다 눈에 보이는 팩트가 신뢰감' },
  { id: 16, dimension: 'SN', forward: false,
    text: '아직 세상에 없는 걸 상상하는 게 너무 재밌음' },
  { id: 17, dimension: 'SN', forward: true,
    text: '레시피나 매뉴얼 그대로 따라하는 게 편함' },
  { id: 18, dimension: 'SN', forward: false,
    text: '정해진 방법? 그거 무시하고 내 방식대로 해보는 게 설렘' },
  { id: 19, dimension: 'SN', forward: true,
    text: '사진 같은 풍경화나 디테일 살아있는 그림이 좋음' },
  { id: 20, dimension: 'SN', forward: false,
    text: '몽환적이고 초현실적인 느낌에 꽂히는 편임' },
  { id: 21, dimension: 'SN', forward: true,
    text: '직접 경험한 것 위주로 판단하는 편' },
  { id: 22, dimension: 'SN', forward: false,
    text: '뭔가 패턴이나 연결고리 찾아내는 직감이 있음' },
  { id: 23, dimension: 'SN', forward: true,
    text: '돈 쓸 때 "이게 실제로 쓸모 있냐"가 가장 중요' },
  { id: 24, dimension: 'SN', forward: false,
    text: '쓸모없어도 영감 주는 것에 기꺼이 지갑 열 수 있음' },

  // ═══════════════════════════════════════════
  // T/F 차원 (12문항) — 사고 vs 감정
  // ═══════════════════════════════════════════
  { id: 25, dimension: 'TF', forward: true,
    text: '뭔가 결정할 때 감정은 일단 빼고 논리적으로 따짐' },
  { id: 26, dimension: 'TF', forward: false,
    text: '그림 고를 때 분석? 그냥 "끌리는 느낌"이 답임' },
  { id: 27, dimension: 'TF', forward: true,
    text: '팩트 폭격이 가짜 칭찬보다 100배 나음' },
  { id: 28, dimension: 'TF', forward: false,
    text: '솔직한 말보다 상대 기분 안 상하게 돌려 말하는 게 맞음' },
  { id: 29, dimension: 'TF', forward: true,
    text: '그림의 기술적 완성도 > 감정적 울림' },
  { id: 30, dimension: 'TF', forward: false,
    text: '기술 부족해도 마음을 울리는 작품이 진짜 명작임' },
  { id: 31, dimension: 'TF', forward: true,
    text: '공정함이 사람 간의 화합보다 중요함' },
  { id: 32, dimension: 'TF', forward: false,
    text: '관계 지키려면 원칙쯤은 좀 양보할 수 있음' },
  { id: 33, dimension: 'TF', forward: true,
    text: '문제 생기면 감정보다 원인부터 파는 편' },
  { id: 34, dimension: 'TF', forward: false,
    text: '문제 생기면 "누가 상처받았나"부터 확인함' },
  { id: 35, dimension: 'TF', forward: true,
    text: '감정에 휘둘리지 않는 냉정함이 필요할 때가 많음' },
  { id: 36, dimension: 'TF', forward: false,
    text: '머리로는 아닌데 마음이 시키면 그쪽으로 감 ㅋㅋ' },

  // ═══════════════════════════════════════════
  // J/P 차원 (12문항) — 판단 vs 인식
  // ═══════════════════════════════════════════
  { id: 37, dimension: 'JP', forward: true,
    text: '일정 딱 정해져 있으면 마음이 편안해짐' },
  { id: 38, dimension: 'JP', forward: false,
    text: '계획? 그때그때 바이브 타는 게 훨씬 재밌음' },
  { id: 39, dimension: 'JP', forward: true,
    text: '투두리스트 만들고 하나씩 체크하는 맛으로 삶' },
  { id: 40, dimension: 'JP', forward: false,
    text: '마감 직전 벼락치기에서 나오는 집중력이 레전드임' },
  { id: 41, dimension: 'JP', forward: true,
    text: '방이 정리 안 되어 있으면 머리도 안 돌아감' },
  { id: 42, dimension: 'JP', forward: false,
    text: '약간 어질러진 환경이 오히려 창작 자극됨' },
  { id: 43, dimension: 'JP', forward: true,
    text: '고민 오래 하는 것보다 빨리 결정하고 실행이 나음' },
  { id: 44, dimension: 'JP', forward: false,
    text: '선택지는 최대한 오래 열어두고 싶음. 가능성 닫기 싫어' },
  { id: 45, dimension: 'JP', forward: true,
    text: '갑자기 계획 바뀌면 좀 스트레스임' },
  { id: 46, dimension: 'JP', forward: false,
    text: '예상 못한 상황이 오히려 두근두근 재밌음' },
  { id: 47, dimension: 'JP', forward: true,
    text: '여행 전에 숙소·맛집·동선 다 세팅해놔야 안심됨' },
  { id: 48, dimension: 'JP', forward: false,
    text: '여행은 무계획이 진리지. 발 닿는 대로 가는 맛' },
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
