/**
 * 12운성(十二運星) 계산
 *
 * 각 천간이 각 지지에서 갖는 생왕사절(生旺死絶)의 운세 단계.
 * 양간은 순행, 음간은 역행.
 */

import { CHEONGAN_HANJA, JIJI_HANJA } from './constants'

export const TWELVE_STAGES = [
  '장생','목욕','관대','건록','제왕','쇠','병','사','묘','절','태','양',
] as const

export type TwelveStage = typeof TWELVE_STAGES[number]

// 각 천간의 장생지 지지 인덱스
const LONGEVITY_BRANCH: Record<number, number> = {
  0: 11, // 갑 → 해
  1: 6,  // 을 → 오
  2: 2,  // 병 → 인
  3: 9,  // 정 → 유
  4: 2,  // 무 → 인
  5: 9,  // 기 → 유
  6: 5,  // 경 → 사
  7: 0,  // 신 → 자
  8: 8,  // 임 → 신
  9: 3,  // 계 → 묘
}

/**
 * 천간 인덱스 + 지지 인덱스 → 12운성
 */
export function getTwelveStage(cheonganIdx: number, jijiIdx: number): TwelveStage {
  const longevity = LONGEVITY_BRANCH[cheonganIdx]
  const isYang = cheonganIdx % 2 === 0
  const direction = isYang ? 1 : -1
  const offset = ((jijiIdx - longevity) * direction % 12 + 12) % 12
  return TWELVE_STAGES[offset]
}

/**
 * 전체 12운성 테이블 (특정 천간 기준)
 */
export function getTwelveStageTable(cheonganIdx: number): Record<string, TwelveStage> {
  const result: Record<string, TwelveStage> = {}
  for (let j = 0; j < 12; j++) {
    result[JIJI_HANJA[j]] = getTwelveStage(cheonganIdx, j)
  }
  return result
}
