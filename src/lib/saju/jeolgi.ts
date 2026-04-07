/**
 * 24절기 데이터 (1900~2100)
 *
 * 각 절기의 정확한 양력 날짜+시각을 기반으로
 * 사주의 월 경계를 판정한다.
 *
 * 사주에서 "월"을 나누는 12절기 (절기만 사용, 중기는 제외):
 *   1월(인월): 입춘  │  2월(묘월): 경칩  │  3월(진월): 청명
 *   4월(사월): 입하  │  5월(오월): 망종  │  6월(미월): 소서
 *   7월(신월): 입추  │  8월(유월): 백로  │  9월(술월): 한로
 *  10월(해월): 입동  │ 11월(자월): 대설  │ 12월(축월): 소한
 */

// ── 절기 이름 ────────────────────────────────────────
export const JEOLGI_NAMES = [
  '소한','대한','입춘','우수','경칩','춘분',
  '청명','곡우','입하','소만','망종','하지',
  '소서','대서','입추','처서','백로','추분',
  '한로','상강','입동','소설','대설','동지',
] as const

// 월을 나누는 12절기 인덱스 (절기만, 0-indexed in JEOLGI_NAMES)
// 소한(0)=12월, 입춘(2)=1월, 경칩(4)=2월, 청명(6)=3월,
// 입하(8)=4월, 망종(10)=5월, 소서(12)=6월, 입추(14)=7월,
// 백로(16)=8월, 한로(18)=9월, 입동(20)=10월, 대설(22)=11월
export const JEOLGI_MONTH_IDX = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 0] as const
// 사주월:                      1월 2월 3월 4월 5월  6월  7월  8월  9월 10월 11월 12월

/**
 * 절기 시각 데이터
 *
 * 천문 계산 기반 근사값. key = 연도,
 * value = 24절기 [월, 일, 시, 분] 배열 (소한부터 동지까지 순서).
 *
 * 범위: 1920~2050 (핵심 범위). 범위 밖은 근사 공식 사용.
 */
type JeolgiEntry = [number, number, number, number] // [month, day, hour, minute]

// ── 절기 근사 계산 (천문 알고리즘) ───────────────────
// 태양 황경 기반 절기 시각 계산
function _julianDay(y: number, m: number, d: number, h: number = 0): number {
  if (m <= 2) { y -= 1; m += 12 }
  const A = Math.floor(y / 100)
  const B = 2 - A + Math.floor(A / 4)
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + h / 24 + B - 1524.5
}

function _solarLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0
  // 태양 평균 황경
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T
  // 태양 평균 근점이각
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T
  const Mrad = M * Math.PI / 180
  // 태양 중심차
  const C = (1.914602 - 0.004817 * T) * Math.sin(Mrad)
    + 0.019993 * Math.sin(2 * Mrad)
    + 0.000289 * Math.sin(3 * Mrad)
  // 태양 진황경
  let sunLon = L0 + C
  // 0~360 정규화
  sunLon = ((sunLon % 360) + 360) % 360
  return sunLon
}

// 특정 황경 도달 시각 (Julian Day) 탐색
function _findSolarLongitudeJD(year: number, targetLon: number): number {
  // 초기 추정: targetLon=315 → 입춘(약 2/4)
  const approxMonth = ((targetLon / 30) + 1) % 12 + 1
  let jd = _julianDay(year, Math.ceil(approxMonth), 1)

  // 뉴턴 반복법
  for (let i = 0; i < 50; i++) {
    let lon = _solarLongitude(jd)
    let diff = targetLon - lon
    // 경계 처리
    if (diff > 180) diff -= 360
    if (diff < -180) diff += 360
    if (Math.abs(diff) < 0.0001) break
    jd += diff / 360 * 365.25
  }
  return jd
}

function _jdToDate(jd: number): { year: number; month: number; day: number; hour: number; minute: number } {
  const z = Math.floor(jd + 0.5)
  const f = jd + 0.5 - z
  let A: number
  if (z < 2299161) {
    A = z
  } else {
    const alpha = Math.floor((z - 1867216.25) / 36524.25)
    A = z + 1 + alpha - Math.floor(alpha / 4)
  }
  const B = A + 1524
  const C = Math.floor((B - 122.1) / 365.25)
  const D = Math.floor(365.25 * C)
  const E = Math.floor((B - D) / 30.6001)

  const day = B - D - Math.floor(30.6001 * E)
  const month = E < 14 ? E - 1 : E - 13
  const year = month > 2 ? C - 4716 : C - 4715

  const totalHours = f * 24 + 9 // +9 = KST
  const hour = Math.floor(totalHours) % 24
  const minute = Math.floor((totalHours - Math.floor(totalHours)) * 60)

  return { year, month, day, hour, minute }
}

// 24절기 황경 (소한=285도부터 15도 간격)
const JEOLGI_LONGITUDES = [
  285, 300, 315, 330, 345, 0,
  15,  30,  45,  60,  75,  90,
  105, 120, 135, 150, 165, 180,
  195, 210, 225, 240, 255, 270,
]

/**
 * 특정 연도의 24절기 시각을 계산
 */
export function getJeolgiDates(year: number): JeolgiEntry[] {
  const results: JeolgiEntry[] = []

  for (let i = 0; i < 24; i++) {
    const lon = JEOLGI_LONGITUDES[i]
    // 소한(285)~대한(300)은 해당 연도 1월
    // 동지(270)는 해당 연도 12월이지만, 전년도 계산에서 나올 수 있음
    const calcYear = i < 2 ? year : (lon >= 270 && i >= 23) ? year : year
    const jd = _findSolarLongitudeJD(calcYear, lon)
    const d = _jdToDate(jd)
    results.push([d.month, d.day, d.hour, d.minute])
  }

  return results
}

/**
 * 주어진 양력 날짜가 어느 절기 월에 해당하는지 판별
 *
 * @returns { sajuMonth: 1~12 (인월=1), jeolgiName: 절기 이름 }
 */
export function getJeolgiMonth(
  year: number,
  month: number,
  day: number,
  hour: number = 12,
): { sajuMonth: number; jeolgiName: string } {
  // 올해 + 전년도 절기 데이터 필요
  const thisYear = getJeolgiDates(year)
  const prevYear = getJeolgiDates(year - 1)

  // 12절기 (월 경계)만 추출: 입춘(idx2), 경칩(4), 청명(6), 입하(8),
  // 망종(10), 소서(12), 입추(14), 백로(16), 한로(18), 입동(20), 대설(22), 소한(0)
  const jeolgiIndices = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 0]
  const sajuMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

  const dateVal = month * 10000 + day * 100 + hour

  // 뒤에서부터 검사 (가장 최근 절기)
  for (let i = jeolgiIndices.length - 1; i >= 0; i--) {
    const jIdx = jeolgiIndices[i]
    const [jm, jd, jh] = jIdx === 0
      ? thisYear[0]                    // 소한은 올해 1월
      : thisYear[jIdx]
    const jeolgiVal = jm * 10000 + jd * 100 + jh

    if (dateVal >= jeolgiVal) {
      return {
        sajuMonth: sajuMonths[i],
        jeolgiName: JEOLGI_NAMES[jIdx],
      }
    }
  }

  // 소한 이전이면 전년도 12월(축월)
  return { sajuMonth: 12, jeolgiName: '대설' }
}

/**
 * 입춘 전후 연도 보정
 * 입춘 이전이면 전년도로 취급
 */
export function getAdjustedYear(year: number, month: number, day: number, hour: number = 12): number {
  const thisYear = getJeolgiDates(year)
  const [im, id, ih] = thisYear[2] // 입춘 = index 2

  const dateVal = month * 10000 + day * 100 + hour
  const ipchunVal = im * 10000 + id * 100 + ih

  return dateVal < ipchunVal ? year - 1 : year
}
