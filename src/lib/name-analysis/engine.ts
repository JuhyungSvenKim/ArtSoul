/**
 * 성명학 계산 엔진 — 음향오행, 수리, 자원오행, 용신매칭
 */
import type { Ohaeng } from '@/types/ohaeng'
import type {
  SoundOhaengChar, SoundOhaengResult,
  SuriGyeok, SuriResult,
  JawonOhaengChar, JawonOhaengResult,
  YongsinMatchResult,
} from './types'
import {
  CHOSEONG_OHAENG, getChoseong, ohaengRelation,
  suriToOhaeng, SURI_81, HANJA_STROKES,
  OHAENG_SANGSAENG,
} from './constants'

// ── 1. 음향오행 (Sound Five Elements) ──────────────
export function analyzeSoundOhaeng(nameKorean: string): SoundOhaengResult {
  const chars: SoundOhaengChar[] = []
  for (const ch of nameKorean) {
    const cho = getChoseong(ch)
    const oh = CHOSEONG_OHAENG[cho]
    if (cho && oh) {
      chars.push({ char: ch, choseong: cho, ohaeng: oh })
    }
  }

  const flow = chars.map(c => c.ohaeng)
  const { analysis, score } = evaluateOhaengFlow(flow)

  return { chars, flow, flowAnalysis: analysis, score }
}

// 오행 흐름 평가 (상생=좋음, 상극=나쁨)
function evaluateOhaengFlow(flow: Ohaeng[]): { analysis: string; score: number } {
  if (flow.length < 2) return { analysis: '글자가 부족하여 흐름 분석 불가', score: 50 }

  let score = 60
  const parts: string[] = []

  for (let i = 0; i < flow.length - 1; i++) {
    const rel = ohaengRelation(flow[i], flow[i + 1])
    const pair = `${flow[i]}→${flow[i + 1]}`
    if (rel === '상생') {
      score += 20
      parts.push(`${pair} 상생(생해주는 관계로 좋음)`)
    } else if (rel === '역생') {
      score += 15
      parts.push(`${pair} 역생(도움받는 관계로 양호)`)
    } else if (rel === '비화') {
      score += 5
      parts.push(`${pair} 비화(같은 기운, 무난)`)
    } else if (rel === '상극') {
      score -= 15
      parts.push(`${pair} 상극(부딪히는 관계로 주의)`)
    } else {
      score -= 10
      parts.push(`${pair} 역극(눌리는 관계로 주의)`)
    }
  }

  return { analysis: parts.join('. '), score: Math.max(0, Math.min(100, score)) }
}

// ── 2. 수리 81수리 (Stroke Numerology) ─────────────
function getSuriEntry(n: number): { rating: SuriGyeok['rating']; meaning: string } {
  const idx = n <= 0 ? 0 : n > 81 ? ((n - 1) % 80) + 1 : n
  const entry = SURI_81[idx] || SURI_81[0]
  return { rating: entry.rating, meaning: entry.keyword }
}

function makeGyeok(name: string, value: number): SuriGyeok {
  const { rating, meaning } = getSuriEntry(value)
  return { name, value, ohaeng: suriToOhaeng(value), rating, meaning }
}

const RATING_SCORE: Record<string, number> = {
  '대길': 100, '길': 80, '반길반흉': 50, '흉': 25, '대흉': 10,
}

export function analyzeSuri(surname: number, name1: number, name2: number): SuriResult {
  // 3글자 이름 (성1 + 이름2)
  const cheongyeok = makeGyeok('천격(天格)', surname + 1)
  const ingyeok = makeGyeok('인격(人格)', surname + name1)
  const jigyeok = makeGyeok('지격(地格)', name2 > 0 ? name1 + name2 : name1 + 1)
  const chonggyeok = makeGyeok('총격(總格)', surname + name1 + name2)
  const oegyeokVal = name2 > 0
    ? (chonggyeok.value - ingyeok.value + 1)
    : 2
  const oegyeok = makeGyeok('외격(外格)', Math.max(oegyeokVal, 1))

  const gyeoks = [cheongyeok, ingyeok, jigyeok, chonggyeok, oegyeok]
  // 인격·지격·총격이 핵심 (천격/외격은 보조)
  const coreScore = (
    RATING_SCORE[ingyeok.rating] * 0.35 +
    RATING_SCORE[jigyeok.rating] * 0.25 +
    RATING_SCORE[chonggyeok.rating] * 0.30 +
    RATING_SCORE[oegyeok.rating] * 0.10
  )
  const overallScore = Math.round(coreScore)

  let overallRating = '보통'
  if (overallScore >= 85) overallRating = '매우 좋음'
  else if (overallScore >= 70) overallRating = '좋음'
  else if (overallScore >= 50) overallRating = '보통'
  else if (overallScore >= 30) overallRating = '주의'
  else overallRating = '불리'

  return {
    strokes: { surname, name1, name2 },
    cheongyeok, ingyeok, jigyeok, chonggyeok, oegyeok,
    overallScore, overallRating,
  }
}

// ── 3. 자원오행 (Character Five Elements) ──────────
export function analyzeJawonOhaeng(hanjaName: string): JawonOhaengResult {
  const chars: JawonOhaengChar[] = []

  for (const ch of hanjaName) {
    if (ch === ' ') continue
    const strokes = HANJA_STROKES[ch]
    if (strokes) {
      chars.push({ char: ch, strokes, ohaeng: suriToOhaeng(strokes) })
    }
  }

  if (chars.length === 0) {
    return { chars: [], flow: [], flowAnalysis: '한자를 인식할 수 없습니다', score: 0 }
  }

  const flow = chars.map(c => c.ohaeng)
  const { analysis, score } = evaluateOhaengFlow(flow)

  return { chars, flow, flowAnalysis: analysis, score }
}

// ── 4. 사주용신 매칭 ───────────────────────────────
export function matchYongsin(
  nameOhaengs: Ohaeng[],
  yongsinElement: Ohaeng,
): YongsinMatchResult {
  if (nameOhaengs.length === 0) {
    return {
      yongsinElement,
      nameElements: [],
      matchType: '무관',
      compatibility: 50,
      description: '이름 오행 정보가 없어 매칭 불가',
      recommendation: '한자 이름을 입력하면 더 정확한 분석이 가능합니다',
    }
  }

  // 이름에서 가장 많은 오행
  const count: Record<string, number> = {}
  for (const oh of nameOhaengs) count[oh] = (count[oh] || 0) + 1
  const sorted = Object.entries(count).sort((a, b) => b[1] - a[1])
  const dominant = sorted[0][0] as Ohaeng

  // 용신과의 관계
  let matchType: YongsinMatchResult['matchType']
  let compat = 50
  let desc = ''
  let rec = ''

  if (dominant === yongsinElement) {
    matchType = '동일'
    compat = 95
    desc = `이름의 주요 오행(${dominant})이 용신과 동일하여 최상의 조합`
    rec = '이름이 사주에 매우 잘 맞습니다. 이름의 기운이 부족한 오행을 보충해줍니다'
  } else if (OHAENG_SANGSAENG[dominant] === yongsinElement) {
    matchType = '상생'
    compat = 85
    desc = `이름의 주요 오행(${dominant})이 용신(${yongsinElement})을 생하여 좋은 조합`
    rec = '이름이 용신을 도와주는 구조로 좋습니다'
  } else if (OHAENG_SANGSAENG[yongsinElement] === dominant) {
    matchType = '상생'
    compat = 75
    desc = `용신(${yongsinElement})이 이름의 주요 오행(${dominant})을 생하여 양호한 조합`
    rec = '용신이 이름을 살려주는 구조로 괜찮습니다'
  } else {
    const rel = ohaengRelation(dominant, yongsinElement)
    if (rel === '상극' || rel === '역극') {
      matchType = '상극'
      compat = 30
      desc = `이름의 주요 오행(${dominant})이 용신(${yongsinElement})과 상극 관계`
      rec = `${yongsinElement} 기운을 보충할 수 있는 환경(색상, 방향, 계절)으로 보완하세요`
    } else {
      matchType = '무관'
      compat = 50
      desc = `이름의 주요 오행(${dominant})과 용신(${yongsinElement})이 직접적 관계가 약함`
      rec = '큰 문제는 없으나, 용신 오행을 생활에서 의식적으로 보충하면 좋습니다'
    }
  }

  return {
    yongsinElement,
    nameElements: nameOhaengs,
    matchType,
    compatibility: compat,
    description: desc,
    recommendation: rec,
  }
}

// ── 한자 획수 조회 헬퍼 ────────────────────────────
export function getHanjaStrokes(ch: string): number | null {
  return HANJA_STROKES[ch] ?? null
}
