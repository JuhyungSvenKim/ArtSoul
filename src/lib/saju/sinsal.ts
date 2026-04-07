/**
 * 신살(神殺) 판별 — 삼합 기준 정통 방식
 */

import type { Ganji } from './types'
import { JIJI_KOR } from './constants'

export interface SinsalItem {
  name: string
  description: string
  effect: 'positive' | 'negative' | 'neutral'
  position: string   // 어느 기둥에서 발견되었는지
}

// ── 천을귀인 (日干 기준) ─────────────────────────────
const CHEONEUL_GUIIN: Record<number, number[]> = {
  0: [1, 7],   // 갑 → 축, 미
  1: [0, 8],   // 을 → 자, 신
  2: [11, 9],  // 병 → 해, 유
  3: [11, 9],  // 정 → 해, 유
  4: [1, 7],   // 무 → 축, 미
  5: [0, 8],   // 기 → 자, 신
  6: [1, 7],   // 경 → 축, 미
  7: [2, 6],   // 신 → 인, 오
  8: [5, 3],   // 임 → 사, 묘
  9: [5, 3],   // 계 → 사, 묘
}

// ── 역마살 (日支/年支 삼합 기준) ─────────────────────
// 삼합의 생지를 충하는 글자
const YEOKMA: Record<number, number> = {
  2: 8, 6: 8, 10: 8,   // 인/오/술 → 신
  5: 11, 9: 11, 1: 11, // 사/유/축 → 해
  8: 2, 0: 2, 4: 2,    // 신/자/진 → 인
  11: 5, 3: 5, 7: 5,   // 해/묘/미 → 사
}

// ── 도화살 (日支/年支 삼합 왕지) ─────────────────────
const DOHWA: Record<number, number> = {
  2: 3, 6: 3, 10: 3,   // 인/오/술 → 묘
  5: 6, 9: 6, 1: 6,    // 사/유/축 → 오
  8: 9, 0: 9, 4: 9,    // 신/자/진 → 유
  11: 0, 3: 0, 7: 0,   // 해/묘/미 → 자
}

// ── 화개살 (日支/年支 삼합 묘지) ─────────────────────
const HWAGAE: Record<number, number> = {
  2: 10, 6: 10, 10: 10, // 인/오/술 → 술
  5: 1, 9: 1, 1: 1,     // 사/유/축 → 축
  8: 4, 0: 4, 4: 4,     // 신/자/진 → 진
  11: 7, 3: 7, 7: 7,    // 해/묘/미 → 미
}

// ── 양인살 (양간 일간만, 건록 다음 지지) ──────────────
const YANGIN: Record<number, number> = {
  0: 3,  // 갑 → 묘
  2: 6,  // 병 → 오
  4: 6,  // 무 → 오
  6: 9,  // 경 → 유
  8: 0,  // 임 → 자
}

// ── 문창귀인 (日干 기준) ─────────────────────────────
const MUNCHANG: Record<number, number> = {
  0: 5,  // 갑 → 사
  1: 6,  // 을 → 오
  2: 8,  // 병 → 신
  3: 9,  // 정 → 유
  4: 8,  // 무 → 신
  5: 9,  // 기 → 유
  6: 11, // 경 → 해
  7: 0,  // 신 → 자
  8: 2,  // 임 → 인
  9: 3,  // 계 → 묘
}

// ── 학당귀인 (日干 기준, 장생지) ─────────────────────
const HAKDANG: Record<number, number> = {
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

const POSITION_NAMES = ['연주', '월주', '일주', '시주']

/**
 * 전체 사주에서 신살 판별
 */
export function analyzeSinsal(pillars: {
  yeonju: Ganji
  wolju: Ganji
  ilju: Ganji
  siju: Ganji
}): SinsalItem[] {
  const results: SinsalItem[] = []
  const p = [pillars.yeonju, pillars.wolju, pillars.ilju, pillars.siju]
  const dayGanIdx = pillars.ilju.cheonganIdx
  const dayJiIdx = pillars.ilju.jijiIdx
  const yearJiIdx = pillars.yeonju.jijiIdx

  const allJiji = p.map(x => x.jijiIdx)

  // 천을귀인
  const guiinTargets = CHEONEUL_GUIIN[dayGanIdx] || []
  for (let i = 0; i < 4; i++) {
    if (guiinTargets.includes(allJiji[i])) {
      results.push({
        name: '천을귀인',
        description: '귀인의 도움을 받아 위기를 모면하고 복을 누림',
        effect: 'positive',
        position: POSITION_NAMES[i],
      })
    }
  }

  // 역마살 (일지 기준)
  const yeokmaTarget = YEOKMA[dayJiIdx]
  if (yeokmaTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (i === 2) continue // 일지 자신 제외
      if (allJiji[i] === yeokmaTarget) {
        results.push({
          name: '역마살',
          description: '이동과 변화가 많으며 해외 인연이 있음',
          effect: 'neutral',
          position: POSITION_NAMES[i],
        })
      }
    }
  }

  // 도화살 (일지 기준)
  const dohwaTarget = DOHWA[dayJiIdx]
  if (dohwaTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (i === 2) continue
      if (allJiji[i] === dohwaTarget) {
        results.push({
          name: '도화살',
          description: '매력적이며 예술적 감각이 뛰어나고 대인관계가 좋음',
          effect: 'positive',
          position: POSITION_NAMES[i],
        })
      }
    }
  }

  // 화개살 (일지 기준)
  const hwagaeTarget = HWAGAE[dayJiIdx]
  if (hwagaeTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (i === 2) continue
      if (allJiji[i] === hwagaeTarget) {
        results.push({
          name: '화개살',
          description: '학문·종교·예술에 재능이 있으며 정신세계가 깊음',
          effect: 'positive',
          position: POSITION_NAMES[i],
        })
      }
    }
  }

  // 양인살 (양간만)
  if (dayGanIdx % 2 === 0 && YANGIN[dayGanIdx] !== undefined) {
    const target = YANGIN[dayGanIdx]
    for (let i = 0; i < 4; i++) {
      if (i === 2) continue
      if (allJiji[i] === target) {
        results.push({
          name: '양인살',
          description: '강한 의지와 추진력이 있으나 과격해질 수 있음',
          effect: 'negative',
          position: POSITION_NAMES[i],
        })
      }
    }
  }

  // 문창귀인
  const munchangTarget = MUNCHANG[dayGanIdx]
  for (let i = 0; i < 4; i++) {
    if (allJiji[i] === munchangTarget) {
      results.push({
        name: '문창귀인',
        description: '학문과 문필에 재능이 있어 시험운과 학업운이 좋음',
        effect: 'positive',
        position: POSITION_NAMES[i],
      })
    }
  }

  // 학당귀인
  const hakdangTarget = HAKDANG[dayGanIdx]
  for (let i = 0; i < 4; i++) {
    if (allJiji[i] === hakdangTarget) {
      results.push({
        name: '학당귀인',
        description: '학문적 재능이 뛰어나고 배움에 대한 열정이 강함',
        effect: 'positive',
        position: POSITION_NAMES[i],
      })
    }
  }

  return results
}
