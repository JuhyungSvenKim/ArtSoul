/**
 * 합(合) / 충(沖) / 형(刑) / 파(破) / 해(害) 계산
 *
 * 사주 네 기둥의 천간·지지 간 관계를 모두 분석한다.
 */

import type { Ganji } from './types'

// ── 천간합 (天干合) ──────────────────────────────────
// [간1 idx, 간2 idx, 합화 오행]
export const CHEONGAN_HAP: [number, number, string][] = [
  [0, 5, '토'], // 갑 + 기
  [1, 6, '금'], // 을 + 경
  [2, 7, '수'], // 병 + 신
  [3, 8, '목'], // 정 + 임
  [4, 9, '화'], // 무 + 계
]

// ── 천간충 (天干沖) ──────────────────────────────────
// 같은 오행 양 vs 양, 음 vs 음이 아닌 — 상극 관계 4쌍
export const CHEONGAN_CHUNG: [number, number][] = [
  [0, 6], // 갑 + 경
  [1, 7], // 을 + 신
  [2, 8], // 병 + 임
  [3, 9], // 정 + 계
]

// ── 지지 육합 (六合) ─────────────────────────────────
export const JIJI_YUKHAP: [number, number, string][] = [
  [0, 1, '토'],   // 자 + 축
  [2, 11, '목'],  // 인 + 해
  [3, 10, '화'],  // 묘 + 술
  [4, 9, '금'],   // 진 + 유
  [5, 8, '수'],   // 사 + 신
  [6, 7, '화'],   // 오 + 미
]

// ── 지지 삼합 (三合) ─────────────────────────────────
export const JIJI_SAMHAP: [number, number, number, string][] = [
  [11, 3, 7, '목'],  // 해 + 묘 + 미
  [2, 6, 10, '화'],  // 인 + 오 + 술
  [5, 9, 1, '금'],   // 사 + 유 + 축
  [8, 0, 4, '수'],   // 신 + 자 + 진
]

// ── 지지 방합 (方合) ─────────────────────────────────
export const JIJI_BANGHAP: [number, number, number, string][] = [
  [2, 3, 4, '목'],    // 인 + 묘 + 진
  [5, 6, 7, '화'],    // 사 + 오 + 미
  [8, 9, 10, '금'],   // 신 + 유 + 술
  [11, 0, 1, '수'],   // 해 + 자 + 축
]

// ── 지지 육충 (六沖) ─────────────────────────────────
export const JIJI_YUKCHUNG: [number, number][] = [
  [0, 6],   // 자 + 오
  [1, 7],   // 축 + 미
  [2, 8],   // 인 + 신
  [3, 9],   // 묘 + 유
  [4, 10],  // 진 + 술
  [5, 11],  // 사 + 해
]

// ── 지지 삼형 (三刑) ─────────────────────────────────
export interface SamhyungRule {
  name: string
  members: number[]
}

export const JIJI_SAMHYUNG: SamhyungRule[] = [
  { name: '무은지형', members: [2, 5, 8] },     // 인 + 사 + 신
  { name: '지세지형', members: [1, 10, 7] },    // 축 + 술 + 미
  { name: '무례지형', members: [0, 3] },         // 자 + 묘
]

// 자형 (自刑)
export const JIJI_JAHYUNG: number[] = [4, 6, 9, 11] // 진, 오, 유, 해

// ── 지지 파 (破) ─────────────────────────────────────
export const JIJI_PA: [number, number][] = [
  [0, 9],   // 자 + 유
  [1, 4],   // 축 + 진
  [2, 11],  // 인 + 해
  [3, 6],   // 묘 + 오
  [5, 8],   // 사 + 신
  [7, 10],  // 미 + 술
]

// ── 지지 해 (害/穿) ─────────────────────────────────
export const JIJI_HAE: [number, number][] = [
  [0, 7],   // 자 + 미
  [1, 6],   // 축 + 오
  [2, 9],   // 인 + 유
  [3, 8],   // 묘 + 신
  [4, 11],  // 진 + 해
  [5, 10],  // 사 + 술
]

// ── 관계 분석 결과 ───────────────────────────────────
export interface RelationItem {
  type: '천간합' | '천간충' | '육합' | '삼합' | '방합' | '육충' | '삼형' | '자형' | '파' | '해'
  positions: string[]    // 예: ['연주','월주']
  detail: string         // 예: '갑기합토'
}

/**
 * 사주 네 기둥의 모든 관계를 분석
 */
export function analyzeRelations(pillars: {
  yeonju: Ganji
  wolju: Ganji
  ilju: Ganji
  siju: Ganji
}): RelationItem[] {
  const results: RelationItem[] = []
  const names = ['연주', '월주', '일주', '시주'] as const
  const p = [pillars.yeonju, pillars.wolju, pillars.ilju, pillars.siju]

  // 천간 관계 (2개씩 쌍)
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      const ci = p[i].cheonganIdx
      const cj = p[j].cheonganIdx

      // 천간합
      for (const [a, b, oh] of CHEONGAN_HAP) {
        if ((ci === a && cj === b) || (ci === b && cj === a)) {
          results.push({
            type: '천간합',
            positions: [names[i], names[j]],
            detail: `${p[i].cheonganKor}${p[j].cheonganKor}합${oh}`,
          })
        }
      }

      // 천간충
      for (const [a, b] of CHEONGAN_CHUNG) {
        if ((ci === a && cj === b) || (ci === b && cj === a)) {
          results.push({
            type: '천간충',
            positions: [names[i], names[j]],
            detail: `${p[i].cheonganKor}${p[j].cheonganKor}충`,
          })
        }
      }
    }
  }

  // 지지 관계 (2개씩 쌍)
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      const bi = p[i].jijiIdx
      const bj = p[j].jijiIdx

      // 육합
      for (const [a, b, oh] of JIJI_YUKHAP) {
        if ((bi === a && bj === b) || (bi === b && bj === a)) {
          results.push({
            type: '육합',
            positions: [names[i], names[j]],
            detail: `${p[i].jijiKor}${p[j].jijiKor}합${oh}`,
          })
        }
      }

      // 육충
      for (const [a, b] of JIJI_YUKCHUNG) {
        if ((bi === a && bj === b) || (bi === b && bj === a)) {
          results.push({
            type: '육충',
            positions: [names[i], names[j]],
            detail: `${p[i].jijiKor}${p[j].jijiKor}충`,
          })
        }
      }

      // 파
      for (const [a, b] of JIJI_PA) {
        if ((bi === a && bj === b) || (bi === b && bj === a)) {
          results.push({
            type: '파',
            positions: [names[i], names[j]],
            detail: `${p[i].jijiKor}${p[j].jijiKor}파`,
          })
        }
      }

      // 해
      for (const [a, b] of JIJI_HAE) {
        if ((bi === a && bj === b) || (bi === b && bj === a)) {
          results.push({
            type: '해',
            positions: [names[i], names[j]],
            detail: `${p[i].jijiKor}${p[j].jijiKor}해`,
          })
        }
      }

      // 자형
      if (bi === bj && JIJI_JAHYUNG.includes(bi)) {
        results.push({
          type: '자형',
          positions: [names[i], names[j]],
          detail: `${p[i].jijiKor}${p[j].jijiKor}자형`,
        })
      }
    }
  }

  // 삼합 (3개)
  const branches = p.map(x => x.jijiIdx)
  for (const [a, b, c, oh] of JIJI_SAMHAP) {
    const found: number[] = []
    for (let i = 0; i < 4; i++) {
      if (branches[i] === a || branches[i] === b || branches[i] === c) {
        found.push(i)
      }
    }
    if (found.length >= 3) {
      // 삼합의 3 지지가 모두 있는지
      const has = new Set(found.map(i => branches[i]))
      if (has.has(a) && has.has(b) && has.has(c)) {
        results.push({
          type: '삼합',
          positions: found.map(i => names[i]),
          detail: `삼합${oh}국`,
        })
      }
    }
  }

  // 방합 (3개)
  for (const [a, b, c, oh] of JIJI_BANGHAP) {
    const found: number[] = []
    for (let i = 0; i < 4; i++) {
      if (branches[i] === a || branches[i] === b || branches[i] === c) {
        found.push(i)
      }
    }
    if (found.length >= 3) {
      const has = new Set(found.map(i => branches[i]))
      if (has.has(a) && has.has(b) && has.has(c)) {
        results.push({
          type: '방합',
          positions: found.map(i => names[i]),
          detail: `방합${oh}국`,
        })
      }
    }
  }

  // 삼형
  for (const rule of JIJI_SAMHYUNG) {
    const found: number[] = []
    for (let i = 0; i < 4; i++) {
      if (rule.members.includes(branches[i])) {
        found.push(i)
      }
    }
    if (found.length >= rule.members.length) {
      const has = new Set(found.map(i => branches[i]))
      const allPresent = rule.members.every(m => has.has(m))
      if (allPresent) {
        results.push({
          type: '삼형',
          positions: found.map(i => names[i]),
          detail: rule.name,
        })
      }
    }
  }

  return results
}
