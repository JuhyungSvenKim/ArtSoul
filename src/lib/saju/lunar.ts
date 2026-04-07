/**
 * 음력 → 양력 변환
 * korean-lunar-calendar 라이브러리 래퍼
 */

import KoreanLunarCalendar from 'korean-lunar-calendar'

export interface SolarDate {
  year: number
  month: number
  day: number
}

export function lunarToSolar(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  isLeapMonth: boolean = false,
): SolarDate {
  const cal = new KoreanLunarCalendar()
  cal.setLunarDate(lunarYear, lunarMonth, lunarDay, isLeapMonth)

  const solar = cal.getSolarCalendar()
  return {
    year: solar.year,
    month: solar.month,
    day: solar.day,
  }
}

export function solarToLunar(
  solarYear: number,
  solarMonth: number,
  solarDay: number,
): { year: number; month: number; day: number; isLeapMonth: boolean } {
  const cal = new KoreanLunarCalendar()
  cal.setSolarDate(solarYear, solarMonth, solarDay)

  const lunar = cal.getLunarCalendar()
  return {
    year: lunar.year,
    month: lunar.month,
    day: lunar.day,
    isLeapMonth: lunar.intercalation,
  }
}
