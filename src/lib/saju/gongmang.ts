/**
 * 공망(空亡) 계산
 *
 * 60갑자를 10개씩 6순(旬)으로 나누고,
 * 각 순에서 배정되지 않는 지지 2개가 공망.
 */

import { JIJI_HANJA, JIJI_KOR } from './constants'

export interface Gongmang {
  jiji1: string       // 공망 지지1 (한자)
  jiji2: string       // 공망 지지2 (한자)
  jiji1Kor: string
  jiji2Kor: string
  jiji1Idx: number
  jiji2Idx: number
}

/**
 * 일주의 천간/지지 인덱스 → 공망 지지 2개 산출
 *
 * 원리: 일주가 속한 순(旬)의 시작 지지에서 +10, +11 번째 지지가 공망
 */
export function getGongmang(dayCheonganIdx: number, dayJijiIdx: number): Gongmang {
  // 순 내에서의 위치 = 천간 인덱스 (0~9)
  const posInCycle = dayCheonganIdx
  // 순 시작의 지지 인덱스
  const baseBranch = ((dayJijiIdx - posInCycle) % 12 + 12) % 12
  // 공망 = 순에 포함되지 않는 지지 2개
  const idx1 = (baseBranch + 10) % 12
  const idx2 = (baseBranch + 11) % 12

  return {
    jiji1: JIJI_HANJA[idx1],
    jiji2: JIJI_HANJA[idx2],
    jiji1Kor: JIJI_KOR[idx1],
    jiji2Kor: JIJI_KOR[idx2],
    jiji1Idx: idx1,
    jiji2Idx: idx2,
  }
}

/**
 * 특정 지지가 공망에 해당하는지 확인
 */
export function isGongmang(gongmang: Gongmang, jijiIdx: number): boolean {
  return jijiIdx === gongmang.jiji1Idx || jijiIdx === gongmang.jiji2Idx
}
