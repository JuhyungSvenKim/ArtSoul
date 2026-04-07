/**
 * 간지 계산 – 년주, 월주, 일주, 시주
 */

import type { Ganji } from './types'
import {
  CHEONGAN_HANJA, CHEONGAN_KOR, CHEONGAN_OHAENG,
  JIJI_HANJA, JIJI_KOR, JIJI_OHAENG,
  WOLGEON_JIJI_IDX, hourToJijiIdx,
} from './constants'
import { getAdjustedYear, getJeolgiMonth } from './jeolgi'

// ── 헬퍼: 인덱스 → Ganji 객체 ──────────────────────
function makeGanji(cgIdx: number, jjIdx: number): Ganji {
  const ci = ((cgIdx % 10) + 10) % 10
  const ji = ((jjIdx % 12) + 12) % 12
  return {
    cheongan: CHEONGAN_HANJA[ci],
    jiji: JIJI_HANJA[ji],
    cheonganKor: CHEONGAN_KOR[ci],
    jijiKor: JIJI_KOR[ji],
    cheonganIdx: ci,
    jijiIdx: ji,
    ohaeng: CHEONGAN_OHAENG[ci],
    jijiOhaeng: JIJI_OHAENG[ji],
  }
}

// ── 년주 (年柱) ─────────────────────────────────────
/**
 * 입춘 기준 보정된 연도로 년주 산출
 * 공식: (연도 - 4) % 60 → 60갑자 인덱스
 */
export function getYeonju(year: number, month: number, day: number, hour: number = 12): Ganji {
  const adjYear = getAdjustedYear(year, month, day, hour)
  const idx60 = ((adjYear - 4) % 60 + 60) % 60
  return makeGanji(idx60 % 10, idx60 % 12)
}

// ── 월주 (月柱) ─────────────────────────────────────
/**
 * 절기 기준 사주월 판별 → 연간에 따른 월간 산출
 *
 * 월간 공식 (연상법):
 *   갑/기년 → 인월 천간 = 병(2)
 *   을/경년 → 인월 천간 = 무(4)
 *   병/신년 → 인월 천간 = 경(6)
 *   정/임년 → 인월 천간 = 임(8)
 *   무/계년 → 인월 천간 = 갑(0)
 */
const WOLGAN_START = [2, 4, 6, 8, 0] as const // 갑기, 을경, 병신, 정임, 무계

export function getWolju(
  year: number,
  month: number,
  day: number,
  yearCheonganIdx: number,
  hour: number = 12,
): { ganji: Ganji; jeolgiName: string } {
  const { sajuMonth, jeolgiName } = getJeolgiMonth(year, month, day, hour)

  // 월간: 연간에 따른 시작점 + (사주월 - 1)
  const startIdx = WOLGAN_START[yearCheonganIdx % 5]
  const wolganIdx = (startIdx + sajuMonth - 1) % 10

  // 월지: 인월(1월)=寅(2), 묘월(2월)=卯(3), ...
  const woljiIdx = WOLGEON_JIJI_IDX[sajuMonth - 1]

  return {
    ganji: makeGanji(wolganIdx, woljiIdx),
    jeolgiName,
  }
}

// ── 일주 (日柱) ─────────────────────────────────────
/**
 * 기준일로부터 일수 차이로 일진 산출
 * 기준: 2000-01-01 = 갑진일(甲辰) → 천간0, 지지4 → 60갑자 idx=40
 */
const BASE_DATE = new Date(Date.UTC(2000, 0, 1)) // 2000-01-01
const BASE_60_IDX = 40 // 갑진(甲辰)

export function getIlju(year: number, month: number, day: number): Ganji {
  const target = new Date(Date.UTC(year, month - 1, day))
  const diffDays = Math.round((target.getTime() - BASE_DATE.getTime()) / 86400000)
  const idx60 = (((BASE_60_IDX + diffDays) % 60) + 60) % 60
  return makeGanji(idx60 % 10, idx60 % 12)
}

// ── 시주 (時柱) ─────────────────────────────────────
/**
 * 일간에 따른 시간 천간 산출
 *
 * 시간 공식 (일상법):
 *   갑/기일 → 자시 천간 = 갑(0)
 *   을/경일 → 자시 천간 = 병(2)
 *   병/신일 → 자시 천간 = 무(4)
 *   정/임일 → 자시 천간 = 경(6)
 *   무/계일 → 자시 천간 = 임(8)
 */
const SIGAN_START = [0, 2, 4, 6, 8] as const

export function getSiju(hour: number, dayCheonganIdx: number): Ganji {
  const jijiIdx = hourToJijiIdx(hour)
  const startIdx = SIGAN_START[dayCheonganIdx % 5]
  const cheonganIdx = (startIdx + jijiIdx) % 10
  return makeGanji(cheonganIdx, jijiIdx)
}
