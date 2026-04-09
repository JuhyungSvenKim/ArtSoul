/**
 * 사주 → 125 케이스 자동 매칭 엔진
 *
 * 3단계 변환 로직:
 *   1단계: Element 결정 (오행 점수 기반)
 *   2단계: Energy 결정 (사주 성향 + 목적 기반)
 *   3단계: Style 결정 (공간/취향/사주 보조)
 *
 * 최종 점수 = 오행적합도(45%) + 에너지적합도(30%) + 스타일적합도(15%) + 공간적합도(10%)
 */

import type { YongsinResult, OhaengBalance } from '../saju/yongsin'
import type { SajuResult } from '../saju/types'
import type {
  OhaengElement, EnergyLevel, StyleCode, Artwork,
  SpaceType,
} from './types'
import {
  ELEMENT_MAP, OHAENG_TO_ELEMENT,
  ENERGY_MAP, STYLE_MAP,
  buildCaseCode,
} from './types'

// ── 오행 상생/상극 관계 ─────────────────────────────
const OHAENG_LIST = ['목', '화', '토', '금', '수'] as const
type Ohaeng = typeof OHAENG_LIST[number]

const SAENGSAENG: Record<string, string> = { '목': '화', '화': '토', '토': '금', '금': '수', '수': '목' }
const SANGGEUK: Record<string, string> = { '목': '토', '화': '금', '토': '수', '금': '목', '수': '화' }

// ── 사주 분석 입력 ──────────────────────────────────
export interface MatchingInput {
  sajuResult: SajuResult
  yongsinResult?: YongsinResult   // 외부에서 전달 (없으면 sajuResult.yongsin 사용)
  purpose?: string          // 목적: 안정, 재물, 관계, 진정, 추진력, 공부, 사업
  spaceType?: SpaceType     // 공간: 거실, 침실, 서재, 사무실 등
  stylePreference?: StyleCode  // 고객 취향 (선택)
  mode?: 'complement' | 'enhance' | 'both'  // 보완형/활용형/혼합(기본)
}

// ── 매칭 결과 ───────────────────────────────────────
export interface MatchResult {
  caseCode: string
  element: OhaengElement
  energy: EnergyLevel
  style: StyleCode
  totalScore: number
  breakdown: {
    elementScore: number     // 오행 적합도 (45%)
    energyScore: number      // 에너지 적합도 (30%)
    styleScore: number       // 스타일 적합도 (15%)
    spaceScore: number       // 공간 적합도 (10%)
  }
  reason: string
  recommendationType: '보완형' | '활용형'
}

export interface RecommendationResult {
  primary: MatchResult[]     // 최우선 추천 (상위 3개)
  complement: MatchResult[]  // 보완형 추천
  enhance: MatchResult[]     // 활용형 추천
  all: MatchResult[]         // 전체 정렬
  sajuProfile: SajuProfile   // 사주 프로파일 요약
}

// ── 사주 프로파일 (중간 분석) ────────────────────────
export interface SajuProfile {
  dayOhaeng: string
  dayStrength: string
  yongsin: string
  huisin: string
  gisin: string
  excessOhaeng: string[]
  lackOhaeng: string[]
  keywords: string[]
  elementScores: Record<OhaengElement, number>
  energyScores: Record<EnergyLevel, number>
}

// ════════════════════════════════════════════════════════
// 1단계: Element(오행) 점수 계산
// ════════════════════════════════════════════════════════

function calculateElementScores(yongsin: YongsinResult): Record<OhaengElement, number> {
  const scores: Record<OhaengElement, number> = { W: 0, F: 0, E: 0, M: 0, A: 0 }
  const balance = yongsin.ohaengBalance

  for (const oh of OHAENG_LIST) {
    const el = OHAENG_TO_ELEMENT[oh]
    const count = balance[oh as keyof OhaengBalance]

    // 부족 오행 보너스 (+40)
    if (count === 0) {
      scores[el] += 40
    } else if (count === 1) {
      scores[el] += 20
    }

    // 용신 보너스 (+35)
    if (yongsin.yongsin === oh) {
      scores[el] += 35
    }

    // 희신 보너스 (+20)
    if (yongsin.huisin === oh) {
      scores[el] += 20
    }

    // 과다 오행 감점 (-25)
    if (count >= 3) {
      scores[el] -= 25
    }

    // 기신 감점 (-35)
    if (yongsin.gisin === oh) {
      scores[el] -= 35
    }

    // 구신 감점 (-15)
    if (yongsin.gusin === oh) {
      scores[el] -= 15
    }
  }

  // 상생 관계 보너스: 용신을 생하는 오행에 +10
  const yongsinOhaeng = yongsin.yongsin as Ohaeng
  for (const [from, to] of Object.entries(SAENGSAENG)) {
    if (to === yongsinOhaeng) {
      scores[OHAENG_TO_ELEMENT[from]] += 10
    }
  }

  return scores
}

// ════════════════════════════════════════════════════════
// 2단계: Energy(에너지) 점수 계산
// ════════════════════════════════════════════════════════

// 목적 → 에너지 매핑
const PURPOSE_ENERGY_MAP: Record<string, EnergyLevel[]> = {
  '진정': [1, 4],
  '수면': [1],
  '안정': [1, 2],
  '명상': [1],
  '휴식': [1],
  '조직': [2],
  '가족': [2],
  '사업안정': [2, 5],
  '관리': [2],
  '추진': [3],
  '사업확장': [3, 5],
  '리더십': [3],
  '성장': [3],
  '도전': [3],
  '관계': [4],
  '소통': [4],
  '감정': [4, 1],
  '커뮤니케이션': [4],
  '연결': [4],
  '재물': [5],
  '전문성': [5],
  '집중': [5, 1],
  '축적': [5],
  '구조화': [5, 2],
  '공부': [5, 1],
  '사업': [3, 5],
}

// 사주 성향 → 에너지 매핑
function calculateEnergyScores(
  yongsin: YongsinResult,
  purpose?: string,
): Record<EnergyLevel, number> {
  const scores: Record<EnergyLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  const balance = yongsin.ohaengBalance
  const strength = yongsin.dayStrength

  // ── 사주 성향 기반 ──
  // 과열된 사주 (화 과다 or 일간 강) → 여백형 추천
  if (balance['화'] >= 3 || (strength === '강' && balance['화'] >= 2)) {
    scores[1] += 30  // 여백형
    scores[4] += 15  // 유동형
  }

  // 생각 과다 (수 과다) → 여백형/균형형
  if (balance['수'] >= 3) {
    scores[1] += 25
    scores[2] += 15
  }

  // 구조 부족 (토/금 부족) → 균형형/밀도형
  if (balance['토'] === 0 || balance['금'] === 0) {
    scores[2] += 20
    scores[5] += 20
  }

  // 추진력 필요 (목/화 부족) → 역동형
  if (balance['목'] <= 1 && balance['화'] <= 1) {
    scores[3] += 25
  }

  // 감정/관계 이슈 (수/목 불균형) → 유동형
  if (Math.abs(balance['수'] - balance['목']) >= 2) {
    scores[4] += 20
  }

  // 일간 강약 기반
  if (strength === '강') {
    scores[1] += 15   // 강하면 설기 → 여백/유동
    scores[4] += 10
  } else if (strength === '약') {
    scores[3] += 15   // 약하면 보충 → 역동/밀도
    scores[5] += 10
  } else {
    scores[2] += 20   // 중화면 균형 유지
  }

  // 용신 오행 기반 에너지 매핑
  const yongsinOhaeng = yongsin.yongsin
  if (yongsinOhaeng === '수' || yongsinOhaeng === '금') {
    scores[1] += 10  // 수/금 → 여백/유동
    scores[4] += 5
  }
  if (yongsinOhaeng === '화' || yongsinOhaeng === '목') {
    scores[3] += 10  // 화/목 → 역동
  }
  if (yongsinOhaeng === '토') {
    scores[2] += 10  // 토 → 균형/밀도
    scores[5] += 5
  }

  // ── 목적 기반 ──
  if (purpose) {
    const purposes = purpose.split(/[,\s]+/).filter(Boolean)
    for (const p of purposes) {
      const mapped = PURPOSE_ENERGY_MAP[p]
      if (mapped) {
        scores[mapped[0]] += 25
        if (mapped[1]) scores[mapped[1]] += 10
      }
    }
  }

  return scores
}

// ════════════════════════════════════════════════════════
// 3단계: Style(스타일) 점수 계산
// ════════════════════════════════════════════════════════

// 공간 → 스타일 적합도
const SPACE_STYLE_AFFINITY: Record<string, Partial<Record<StyleCode, number>>> = {
  '거실': { S3: 30, S1: 20, S4: 15, S5: 10 },
  '침실': { S2: 25, S3: 25, S1: 15 },
  '서재': { S2: 30, S1: 25, S5: 15 },
  '사무실': { S3: 30, S4: 20, S1: 15 },
  '상업공간': { S4: 30, S3: 20, S5: 15 },
  '카페': { S4: 25, S3: 25, S2: 15 },
  '로비': { S1: 25, S5: 25, S3: 20 },
  '기타': { S3: 20, S4: 15, S1: 15, S2: 15, S5: 15 },
}

// 사주 보조 → 스타일 매핑
function calculateStyleScores(
  yongsin: YongsinResult,
  spaceType?: SpaceType,
  preference?: StyleCode,
): Record<StyleCode, number> {
  const scores: Record<StyleCode, number> = { S1: 0, S2: 0, S3: 0, S4: 0, S5: 0 }

  // ── 고객 취향 최우선 (+40) ──
  if (preference) {
    scores[preference] += 40
  }

  // ── 공간 적합성 (+30 최대) ──
  if (spaceType) {
    const affinities = SPACE_STYLE_AFFINITY[spaceType] || SPACE_STYLE_AFFINITY['기타']
    for (const [style, score] of Object.entries(affinities)) {
      scores[style as StyleCode] += score!
    }
  } else {
    // 공간 미지정 시 S3(범용) 약간 가산
    scores.S3 += 10
  }

  // ── 사주 보조 반영 ──
  const dayOhaeng = yongsin.dayOhaeng
  const strength = yongsin.dayStrength

  // 수/금 용신 → 동양적/명상적 (S2)
  if (yongsin.yongsin === '수' || yongsin.yongsin === '금') {
    scores.S2 += 15
    scores.S5 += 5
  }

  // 화/목 용신 → 젊고 에너지틱 (S4)
  if (yongsin.yongsin === '화' || yongsin.yongsin === '목') {
    scores.S4 += 15
    scores.S3 += 5
  }

  // 토 용신 → 고전/안정 (S1)
  if (yongsin.yongsin === '토') {
    scores.S1 += 15
    scores.S2 += 5
  }

  // 일간 강 → 밀도/프리미엄 지향
  if (strength === '강') {
    scores.S5 += 10
    scores.S4 += 5
  }

  // 일간 약 → 전통/안정적 스타일 지향
  if (strength === '약') {
    scores.S1 += 10
    scores.S2 += 5
  }

  return scores
}

// ════════════════════════════════════════════════════════
// 공간 적합도 계산
// ════════════════════════════════════════════════════════

const SPACE_ELEMENT_AFFINITY: Record<string, Partial<Record<OhaengElement, number>>> = {
  '거실': { W: 20, E: 25, F: 15, M: 10, A: 10 },
  '침실': { A: 30, W: 20, M: 15, E: 10 },
  '서재': { A: 25, W: 20, M: 20, E: 10 },
  '사무실': { M: 25, E: 20, W: 15, A: 10 },
  '상업공간': { F: 25, W: 20, E: 15, M: 15 },
  '카페': { W: 25, F: 20, E: 15, A: 15 },
  '로비': { M: 25, E: 20, F: 15, A: 10, W: 10 },
  '기타': { W: 15, F: 15, E: 15, M: 15, A: 15 },
}

function calculateSpaceScore(
  element: OhaengElement,
  energy: EnergyLevel,
  spaceType?: SpaceType,
): number {
  if (!spaceType) return 50 // 중립

  const affinity = SPACE_ELEMENT_AFFINITY[spaceType] || SPACE_ELEMENT_AFFINITY['기타']
  let score = affinity[element] || 10

  // 공간별 에너지 적합도
  const quietSpaces = ['침실', '서재']
  const activeSpaces = ['상업공간', '카페', '로비']

  if (quietSpaces.includes(spaceType) && (energy === 1 || energy === 2)) {
    score += 20
  } else if (activeSpaces.includes(spaceType) && (energy === 3 || energy === 4)) {
    score += 20
  } else if (spaceType === '거실' && (energy === 2 || energy === 3)) {
    score += 15
  } else if (spaceType === '사무실' && (energy === 2 || energy === 5)) {
    score += 15
  }

  return Math.min(score, 100)
}

// ════════════════════════════════════════════════════════
// 사주 성향 키워드 추출
// ════════════════════════════════════════════════════════

function extractSajuKeywords(sajuResult: SajuResult): string[] {
  const keywords: string[] = []
  const yongsin = sajuResult.yongsin
  const balance = yongsin.ohaengBalance

  // 일간 성향
  const dayTraits: Record<string, string[]> = {
    '목': ['성장', '추진', '인의'],
    '화': ['열정', '표현', '리더십'],
    '토': ['안정', '포용', '신뢰'],
    '금': ['결단', '정밀', '의리'],
    '수': ['지혜', '유연', '적응'],
  }
  keywords.push(...(dayTraits[yongsin.dayOhaeng] || []))

  // 강약
  if (yongsin.dayStrength === '강') keywords.push('에너지과다', '발산필요')
  if (yongsin.dayStrength === '약') keywords.push('보충필요', '안정추구')

  // 과다/부족
  for (const oh of OHAENG_LIST) {
    if (balance[oh as keyof OhaengBalance] >= 3) keywords.push(`${oh}과다`)
    if (balance[oh as keyof OhaengBalance] === 0) keywords.push(`${oh}부족`)
  }

  // 신살 기반
  for (const sinsal of sajuResult.sinsal) {
    if (sinsal.name === '화개살') keywords.push('예술성')
    if (sinsal.name === '도화살') keywords.push('매력', '인연')
    if (sinsal.name === '역마살') keywords.push('변화', '이동')
    if (sinsal.name === '천을귀인') keywords.push('귀인복')
    if (sinsal.name === '문창귀인') keywords.push('학문', '글재주')
  }

  return [...new Set(keywords)]
}

// ════════════════════════════════════════════════════════
// 메인 매칭 함수
// ════════════════════════════════════════════════════════

/**
 * 사주 원국에서 125 케이스 코드 전체를 스코어링
 */
export function matchSajuToCases(input: MatchingInput): RecommendationResult {
  const { sajuResult, yongsinResult, purpose, spaceType, stylePreference, mode = 'both' } = input
  const yongsin = yongsinResult || (sajuResult as any).yongsin as YongsinResult

  // 1단계: Element 점수
  const elementScores = calculateElementScores(yongsin)

  // 2단계: Energy 점수
  const energyScores = calculateEnergyScores(yongsin, purpose)

  // 3단계: Style 점수
  const styleScores = calculateStyleScores(yongsin, spaceType, stylePreference)

  // 사주 프로파일
  const balance = yongsin.ohaengBalance
  const sajuProfile: SajuProfile = {
    dayOhaeng: yongsin.dayOhaeng,
    dayStrength: yongsin.dayStrength,
    yongsin: yongsin.yongsin,
    huisin: yongsin.huisin,
    gisin: yongsin.gisin,
    excessOhaeng: OHAENG_LIST.filter(o => balance[o as keyof OhaengBalance] >= 3),
    lackOhaeng: OHAENG_LIST.filter(o => balance[o as keyof OhaengBalance] === 0),
    keywords: extractSajuKeywords(sajuResult),
    elementScores,
    energyScores,
  }

  // 모든 125 케이스 스코어링
  const allResults: MatchResult[] = []
  const elements: OhaengElement[] = ['W', 'F', 'E', 'M', 'A']
  const energies: EnergyLevel[] = [1, 2, 3, 4, 5]
  const styles: StyleCode[] = ['S1', 'S2', 'S3', 'S4', 'S5']

  // 정규화를 위한 최대값
  const maxElScore = Math.max(...Object.values(elementScores), 1)
  const maxEnScore = Math.max(...Object.values(energyScores), 1)
  const maxStScore = Math.max(...Object.values(styleScores), 1)

  for (const el of elements) {
    for (const en of energies) {
      for (const st of styles) {
        // 각 축 정규화 (0~100)
        const elNorm = Math.max(0, (elementScores[el] / maxElScore) * 100)
        const enNorm = Math.max(0, (energyScores[en] / maxEnScore) * 100)
        const stNorm = Math.max(0, (styleScores[st] / maxStScore) * 100)
        const spaceNorm = calculateSpaceScore(el, en, spaceType)

        // 가중합산: 45% + 30% + 15% + 10%
        const totalScore = Math.round(
          elNorm * 0.45 +
          enNorm * 0.30 +
          stNorm * 0.15 +
          spaceNorm * 0.10
        )

        // 추천 유형 판별
        const elOhaeng = ELEMENT_MAP[el].ohaeng
        const isComplement = elOhaeng === yongsin.yongsin ||
          balance[elOhaeng as keyof OhaengBalance] === 0 ||
          elOhaeng === yongsin.huisin
        const recommendationType = isComplement ? '보완형' as const : '활용형' as const

        // 이유 생성
        const reason = generateReason(el, en, st, yongsin, purpose, spaceType)

        allResults.push({
          caseCode: buildCaseCode(el, en, st),
          element: el,
          energy: en,
          style: st,
          totalScore,
          breakdown: {
            elementScore: Math.round(elNorm),
            energyScore: Math.round(enNorm),
            styleScore: Math.round(stNorm),
            spaceScore: Math.round(spaceNorm),
          },
          reason,
          recommendationType,
        })
      }
    }
  }

  // 점수 내림차순 정렬
  allResults.sort((a, b) => b.totalScore - a.totalScore)

  const complement = allResults.filter(r => r.recommendationType === '보완형')
  const enhance = allResults.filter(r => r.recommendationType === '활용형')

  // 모드에 따라 primary 결정
  let primary: MatchResult[]
  if (mode === 'complement') {
    primary = complement.slice(0, 5)
  } else if (mode === 'enhance') {
    primary = enhance.slice(0, 5)
  } else {
    // both: 보완형 3개 + 활용형 2개
    primary = [...complement.slice(0, 3), ...enhance.slice(0, 2)]
      .sort((a, b) => b.totalScore - a.totalScore)
  }

  return {
    primary,
    complement: complement.slice(0, 10),
    enhance: enhance.slice(0, 10),
    all: allResults,
    sajuProfile,
  }
}

// ════════════════════════════════════════════════════════
// 추천 이유 생성
// ════════════════════════════════════════════════════════

function generateReason(
  el: OhaengElement,
  en: EnergyLevel,
  st: StyleCode,
  yongsin: YongsinResult,
  purpose?: string,
  spaceType?: SpaceType,
): string {
  const elInfo = ELEMENT_MAP[el]
  const enInfo = ENERGY_MAP[en]
  const stInfo = STYLE_MAP[st]
  const balance = yongsin.ohaengBalance
  const elOhaeng = elInfo.ohaeng

  const parts: string[] = []

  // Element 이유
  if (elOhaeng === yongsin.yongsin) {
    parts.push(`용신(${yongsin.yongsin}) 오행으로 사주 균형 보완`)
  } else if (balance[elOhaeng as keyof OhaengBalance] === 0) {
    parts.push(`부족한 ${elOhaeng} 오행 보충`)
  } else if (elOhaeng === yongsin.huisin) {
    parts.push(`희신(${yongsin.huisin}) 오행으로 용신 지원`)
  } else if (balance[elOhaeng as keyof OhaengBalance] >= 2) {
    parts.push(`기존 ${elOhaeng} 기운 활용·강화`)
  }

  // Energy 이유
  parts.push(`${enInfo.labelKor} 에너지로 ${enInfo.description.split(',')[0]}`)

  // Style 이유
  if (spaceType) {
    parts.push(`${spaceType} 공간에 ${stInfo.labelKor} 스타일 매칭`)
  }

  return parts.join('. ') + '.'
}

// ════════════════════════════════════════════════════════
// 작품 매칭: 사주 + 실제 Artwork DB
// ════════════════════════════════════════════════════════

/**
 * 실제 작품 리스트에서 사주 기반 추천
 */
export function matchArtworks(
  artworks: Artwork[],
  input: MatchingInput,
): (Artwork & { matchScore: number; matchReason: string })[] {
  const recommendation = matchSajuToCases(input)

  // case_code별 점수 맵
  const scoreMap = new Map<string, MatchResult>()
  for (const r of recommendation.all) {
    scoreMap.set(r.caseCode, r)
  }

  // 작품에 매칭 점수 부여
  const scored = artworks.map(artwork => {
    const match = scoreMap.get(artwork.case_code)
    return {
      ...artwork,
      matchScore: match?.totalScore ?? 0,
      matchReason: match?.reason ?? '',
    }
  })

  // 점수 내림차순 정렬
  scored.sort((a, b) => b.matchScore - a.matchScore)
  return scored
}

/**
 * 사주에서 최적 Base Case (Element × Energy) 추출
 * - 빠른 추천용 (스타일 제외)
 */
export function getTopBaseCases(
  recommendation: RecommendationResult,
  count = 3,
): { baseCode: string; element: OhaengElement; energy: EnergyLevel; score: number; reason: string }[] {
  const yongsin: YongsinResult = {
    dayOhaeng: recommendation.sajuProfile.dayOhaeng,
    dayStrength: recommendation.sajuProfile.dayStrength as any,
    ohaengBalance: recommendation.sajuProfile.elementScores as any,
    ohaengPercent: { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 },
    yongsin: recommendation.sajuProfile.yongsin,
    yongsinDescription: '',
    huisin: recommendation.sajuProfile.huisin,
    gisin: recommendation.sajuProfile.gisin,
    gusin: '',
    strengthReason: '',
    summary: '',
  }
  const elementScores = calculateElementScores(yongsin)
  const energyScores = calculateEnergyScores(yongsin)

  const maxEl = Math.max(...Object.values(elementScores), 1)
  const maxEn = Math.max(...Object.values(energyScores), 1)

  const elements: OhaengElement[] = ['W', 'F', 'E', 'M', 'A']
  const energies: EnergyLevel[] = [1, 2, 3, 4, 5]

  const results: { baseCode: string; element: OhaengElement; energy: EnergyLevel; score: number; reason: string }[] = []

  for (const el of elements) {
    for (const en of energies) {
      const elNorm = Math.max(0, (elementScores[el] / maxEl) * 100)
      const enNorm = Math.max(0, (energyScores[en] / maxEn) * 100)
      const score = Math.round(elNorm * 0.6 + enNorm * 0.4)

      const elInfo = ELEMENT_MAP[el]
      const enInfo = ENERGY_MAP[en]
      const reason = `${elInfo.labelKor} × ${enInfo.labelKor}`

      results.push({
        baseCode: `${el}${en}`,
        element: el,
        energy: en,
        score,
        reason,
      })
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, count)
}
