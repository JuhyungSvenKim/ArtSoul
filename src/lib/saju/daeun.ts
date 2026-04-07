/**
 * 대운(大運) 계산
 *
 * 규칙:
 *   양남음녀(陽男陰女) → 순행 (월주에서 다음 간지로)
 *   음남양녀(陰男陽女) → 역행 (월주에서 이전 간지로)
 *
 * 대운수(시작 나이):
 *   생일~가장 가까운 절기까지 일수 ÷ 3 = 대운 시작 나이
 *   순행이면 다음 절기, 역행이면 이전 절기
 */

import type { Ganji, DaeunItem } from './types'
import {
  CHEONGAN_HANJA, CHEONGAN_KOR, CHEONGAN_OHAENG, CHEONGAN_EUMYANG,
  JIJI_HANJA, JIJI_KOR, JIJI_OHAENG,
} from './constants'
import { getJeolgiDates } from './jeolgi'

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

/**
 * 대운 계산
 * @param year 양력 연도
 * @param month 양력 월
 * @param day 양력 일
 * @param gender '남' | '여'
 * @param yeonju 년주 Ganji (음양 판별용)
 */
export function getDaeun(
  year: number,
  month: number,
  day: number,
  gender: '남' | '여',
  yeonju: Ganji,
  wolju?: Ganji,
): { daeun: DaeunItem[]; daeunStartAge: number } {
  // 1) 순행/역행 결정
  const yearEumyang = CHEONGAN_EUMYANG[yeonju.cheonganIdx] // 0=양, 1=음
  const isForward =
    (yearEumyang === 0 && gender === '남') ||
    (yearEumyang === 1 && gender === '여')
  const direction = isForward ? 1 : -1

  // 2) 대운수 계산: 생일에서 가장 가까운 절기까지 일수 / 3
  const daeunStartAge = calcDaeunStartAge(year, month, day, isForward)

  // 3) 월주가 없으면 직접 계산 (순환 의존 방지)
  if (!wolju) {
    const { getAdjustedYear, getJeolgiMonth } = require('./jeolgi')
    const adjYear = getAdjustedYear(year, month, day)
    const idx60 = (((adjYear - 4) % 60) + 60) % 60
    const ycIdx = idx60 % 10
    const WOLGAN_START = [2, 4, 6, 8, 0]
    const WOLGEON_JIJI = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1]
    const { sajuMonth } = getJeolgiMonth(year, month, day)
    const wgIdx = (WOLGAN_START[ycIdx % 5] + sajuMonth - 1) % 10
    const wjIdx = WOLGEON_JIJI[sajuMonth - 1]
    wolju = makeGanji(wgIdx, wjIdx)
  }

  const daeun: DaeunItem[] = []
  for (let i = 1; i <= 8; i++) {
    const cgIdx = (wolju.cheonganIdx + i * direction + 100) % 10
    const jjIdx = (wolju.jijiIdx + i * direction + 120) % 12
    const startAge = Math.round(daeunStartAge + (i - 1) * 10)
    daeun.push({
      ganji: makeGanji(cgIdx, jjIdx),
      startAge,
      endAge: startAge + 9,
    })
  }

  return { daeun, daeunStartAge }
}

/**
 * 대운 시작 나이 계산
 * 생일에서 다음(순행)/이전(역행) 절기까지 일수 ÷ 3
 */
function calcDaeunStartAge(
  year: number,
  month: number,
  day: number,
  isForward: boolean,
): number {
  const birthDate = new Date(Date.UTC(year, month - 1, day))
  const birthMs = birthDate.getTime()

  // 해당 연도 + 전후 연도 절기 수집
  const allJeolgi: Date[] = []
  for (const y of [year - 1, year, year + 1]) {
    const entries = getJeolgiDates(y)
    // 12절기만 (월 경계): idx 0,2,4,6,8,10,12,14,16,18,20,22
    const jeolgiIndices = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]
    for (const idx of jeolgiIndices) {
      const [jm, jd, jh, jmin] = entries[idx]
      allJeolgi.push(new Date(Date.UTC(y, jm - 1, jd, jh, jmin || 0)))
    }
  }

  // 정렬
  allJeolgi.sort((a, b) => a.getTime() - b.getTime())

  let targetDate: Date | null = null

  if (isForward) {
    // 순행: 생일 이후 가장 가까운 절기
    for (const jd of allJeolgi) {
      if (jd.getTime() > birthMs) {
        targetDate = jd
        break
      }
    }
  } else {
    // 역행: 생일 이전 가장 가까운 절기
    for (let i = allJeolgi.length - 1; i >= 0; i--) {
      if (allJeolgi[i].getTime() <= birthMs) {
        targetDate = allJeolgi[i]
        break
      }
    }
  }

  if (!targetDate) return 3 // fallback

  const diffDays = Math.abs(targetDate.getTime() - birthMs) / 86400000
  // 3일 = 1년, 소수점 첫째자리까지
  return Math.round((diffDays / 3) * 10) / 10
}
