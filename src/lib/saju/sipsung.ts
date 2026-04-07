/**
 * 십성(十星/十神) 계산
 *
 * 일간을 기준으로 다른 천간/지지의 관계를 판별한다.
 *
 * 오행 관계 → 십성:
 *   같은 오행 + 같은 음양 = 비견
 *   같은 오행 + 다른 음양 = 겁재
 *   내가 생하는 + 같은 음양 = 식신
 *   내가 생하는 + 다른 음양 = 상관
 *   내가 극하는 + 같은 음양 = 편재
 *   내가 극하는 + 다른 음양 = 정재
 *   나를 극하는 + 같은 음양 = 편관
 *   나를 극하는 + 다른 음양 = 정관
 *   나를 생하는 + 같은 음양 = 편인
 *   나를 생하는 + 다른 음양 = 정인
 */

import type { Ganji, SipsungResult } from './types'
import {
  CHEONGAN_OHAENG, CHEONGAN_EUMYANG,
  JIJI_JUNGGI, SIPSUNG_NAMES,
} from './constants'

// 오행 인덱스: 목0 화1 토2 금3 수4
const OHAENG_MAP: Record<string, number> = { '목': 0, '화': 1, '토': 2, '금': 3, '수': 4 }

// 오행 관계 테이블 [나][상대] → 관계 (0=비겁, 1=식상, 2=재성, 3=관성, 4=인성)
//   비겁: 같은 오행
//   식상: 내가 생 (목→화, 화→토, 토→금, 금→수, 수→목)
//   재성: 내가 극 (목→토, 화→금, 토→수, 금→목, 수→화)
//   관성: 나를 극 (목←금, 화←수, 토←목, 금←화, 수←토)
//   인성: 나를 생 (목←수, 화←목, 토←화, 금←토, 수←금)
const RELATION: number[][] = [
  // 상대→  목  화  토  금  수
  /* 목 */ [0, 1, 2, 3, 4],
  /* 화 */ [4, 0, 1, 2, 3],
  /* 토 */ [3, 4, 0, 1, 2],
  /* 금 */ [2, 3, 4, 0, 1],
  /* 수 */ [1, 2, 3, 4, 0],
]

/**
 * 일간 기준 특정 천간의 십성 판별
 */
function getSipsung(dayGanIdx: number, targetGanIdx: number): string {
  const dayOhaeng = OHAENG_MAP[CHEONGAN_OHAENG[dayGanIdx]]
  const targetOhaeng = OHAENG_MAP[CHEONGAN_OHAENG[targetGanIdx]]
  const relation = RELATION[dayOhaeng][targetOhaeng]

  const sameEumyang = CHEONGAN_EUMYANG[dayGanIdx] === CHEONGAN_EUMYANG[targetGanIdx]

  // 관계 * 2 + 음양 보정
  const idx = relation * 2 + (sameEumyang ? 0 : 1)
  return SIPSUNG_NAMES[idx]
}

/**
 * 지지의 십성 (지장간 정기 기준)
 */
function getJijiSipsung(dayGanIdx: number, jijiIdx: number): string {
  const junggiGanIdx = JIJI_JUNGGI[jijiIdx]
  return getSipsung(dayGanIdx, junggiGanIdx)
}

/**
 * 전체 사주의 십성 결과 산출
 */
export function getSipsungResult(
  ilju: Ganji,
  pillars: { yeonju: Ganji; wolju: Ganji; siju: Ganji },
): SipsungResult {
  const d = ilju.cheonganIdx
  return {
    yeonjuCg: getSipsung(d, pillars.yeonju.cheonganIdx),
    yeonjuJj: getJijiSipsung(d, pillars.yeonju.jijiIdx),
    woljuCg: getSipsung(d, pillars.wolju.cheonganIdx),
    woljuJj: getJijiSipsung(d, pillars.wolju.jijiIdx),
    iljuJj: getJijiSipsung(d, ilju.jijiIdx),
    sijuCg: getSipsung(d, pillars.siju.cheonganIdx),
    sijuJj: getJijiSipsung(d, pillars.siju.jijiIdx),
  }
}
