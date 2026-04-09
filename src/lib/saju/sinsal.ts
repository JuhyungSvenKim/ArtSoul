/**
 * 신살(神殺) 판별 — 약 30종+ 확장
 * sajuplus.net 기준 검증
 */

import type { Ganji } from './types'
import { CHEONGAN_OHAENG, JIJI_OHAENG, JIJI_JUNGGI, CHEONGAN_OHAENG as CG_OH } from './constants'

export interface SinsalItem {
  name: string
  description: string
  effect: 'positive' | 'negative' | 'neutral'
  position: string
}

// ── 천을귀인 (日干 기준 → 지지) ─────────────────────
const CHEONEUL_GUIIN: Record<number, number[]> = {
  0: [1, 7], 1: [0, 8], 2: [11, 9], 3: [11, 9], 4: [1, 7],
  5: [0, 8], 6: [1, 7], 7: [2, 6], 8: [5, 3], 9: [5, 3],
}

// ── 천덕귀인 (月支 기준 → 천간) ────────────────────
const CHEONDUK: Record<number, number> = {
  0: 3, 1: 8, 2: 5, 3: 0, 4: 3, 5: 8, 6: 5, 7: 0,
  8: 9, 9: 2, 10: 1, 11: 6,
}

// ── 월덕귀인 (月支 기준 → 천간) ────────────────────
const WOLDUK: Record<number, number> = {
  2: 2, 6: 2, 10: 2, 8: 8, 0: 8, 4: 8,
  5: 0, 9: 0, 1: 0, 11: 6, 3: 6, 7: 6,
}

// ── 역마살 (日支 삼합 기준) ─────────────────────────
const YEOKMA: Record<number, number> = {
  2: 8, 6: 8, 10: 8, 5: 11, 9: 11, 1: 11,
  8: 2, 0: 2, 4: 2, 11: 5, 3: 5, 7: 5,
}

// ── 도화살 (日支 삼합 왕지) ─────────────────────────
const DOHWA: Record<number, number> = {
  2: 3, 6: 3, 10: 3, 5: 6, 9: 6, 1: 6,
  8: 9, 0: 9, 4: 9, 11: 0, 3: 0, 7: 0,
}

// ── 화개살 (日支 삼합 묘지) ─────────────────────────
const HWAGAE: Record<number, number> = {
  2: 10, 6: 10, 10: 10, 5: 1, 9: 1, 1: 1,
  8: 4, 0: 4, 4: 4, 11: 7, 3: 7, 7: 7,
}

// ── 양인살 (양간 일간만) ────────────────────────────
const YANGIN: Record<number, number> = { 0: 3, 2: 6, 4: 6, 6: 9, 8: 0 }

// ── 문창귀인 (日干 기준 → 지지) ────────────────────
const MUNCHANG: Record<number, number> = {
  0: 5, 1: 6, 2: 8, 3: 9, 4: 8, 5: 9, 6: 11, 7: 0, 8: 2, 9: 3,
}

// ── 학당귀인 (日干 기준) ────────────────────────────
const HAKDANG: Record<number, number> = {
  0: 11, 1: 6, 2: 2, 3: 9, 4: 2, 5: 9, 6: 5, 7: 0, 8: 8, 9: 3,
}

// ── 금여귀인 (日干 기준 → 지지) ────────────────────
const GEUMYEO: Record<number, number> = {
  0: 4, 1: 5, 2: 8, 3: 7, 4: 8, 5: 7, 6: 2, 7: 11, 8: 2, 9: 11,
}

// ── 천관귀인 (日干 기준 → 지지) ────────────────────
const CHEONGWAN: Record<number, number> = {
  0: 7, 1: 8, 2: 9, 3: 11, 4: 0, 5: 1, 6: 2, 7: 5, 8: 6, 9: 3,
}

// ── 복성귀인 (日干 기준 → 지지) ────────────────────
const BOKSUNG: Record<number, number> = {
  0: 2, 1: 8, 2: 0, 3: 11, 4: 2, 5: 1, 6: 6, 7: 5, 8: 8, 9: 9,
}

// ── 겁살 (年支 삼합 기준) ──────────────────────────
const GEOBSAL: Record<number, number> = {
  2: 5, 6: 5, 10: 5, 5: 2, 9: 2, 1: 2,
  8: 11, 0: 11, 4: 11, 11: 8, 3: 8, 7: 8,
}

// ── 장성 (年支 삼합 기준, 제왕지) ──────────────────
const JANGSUNG: Record<number, number> = {
  2: 6, 6: 6, 10: 6, 5: 9, 9: 9, 1: 9,
  8: 0, 0: 0, 4: 0, 11: 3, 3: 3, 7: 3,
}

// ── 반안살 (年支 기준) ─────────────────────────────
const BANAN: Record<number, number> = {
  2: 5, 6: 5, 10: 5, 5: 8, 9: 8, 1: 8,
  8: 11, 0: 11, 4: 11, 11: 2, 3: 2, 7: 2,
}

// ── 괴강살 (특정 간지 조합) ─────────────────────────
// 庚辰(6,4), 庚戌(6,10), 壬辰(8,4), 壬戌(8,10) — 모든 주에서 검사
const GOEGANG_PAIRS: [number, number][] = [[6, 4], [6, 10], [8, 4], [8, 10]]

// ── 원진살 (日支 기준) ─────────────────────────────
const WONJIN: Record<number, number> = {
  0: 7, 1: 6, 2: 5, 3: 4, 4: 3, 5: 2,
  6: 1, 7: 0, 8: 11, 9: 10, 10: 9, 11: 8,
}

// ── 백호살 (日干 12운성 '쇠(衰)' 지지) ──────────────
// 양간: 장생→쇠 순서에서 쇠 위치
// 갑→辰(4), 병→未(7), 무→未(7), 경→戌(10), 임→丑(1)
// 음간: 을→丑(1), 정→戌(10), 기→戌(10), 신→未(7), 계→辰(4)
const BAEKHO: Record<number, number> = {
  0: 4, 1: 1, 2: 7, 3: 10, 4: 7, 5: 10, 6: 10, 7: 7, 8: 1, 9: 4,
}

// ── 홍염살 (日干 기준 → 지지) ──────────────────────
const HONGYEOM: Record<number, number> = {
  0: 6, 1: 2, 2: 2, 3: 7, 4: 4, 5: 4, 6: 10, 7: 9, 8: 0, 9: 8,
}

// ── 천희성 (年支 기준 → 지지) ──────────────────────
const CHEONHUI: Record<number, number> = {
  0: 9, 1: 8, 2: 7, 3: 6, 4: 5, 5: 4,
  6: 3, 7: 2, 8: 1, 9: 0, 10: 11, 11: 10,
}

// ── 효신살 (편인 지지가 있는 위치) ──────────────────
// 편인 = 나(일간)를 생하는데 음양이 같은 오행
// 각 일간의 편인 천간을 구하고, 그 천간이 정기인 지지를 찾음
function getHyosinTargets(dayGanIdx: number): number[] {
  // 일간 오행 → 나를 생하는 오행
  const myOh = CHEONGAN_OHAENG[dayGanIdx]
  const sangMap: Record<string, string> = { 목: '수', 화: '목', 토: '화', 금: '토', 수: '금' }
  const parentOh = sangMap[myOh]
  // 음양이 같은 것 = 편인
  const dayYy = dayGanIdx % 2 // 0=양, 1=음
  // 편인 천간 인덱스 찾기
  const targets: number[] = []
  for (let ci = 0; ci < 10; ci++) {
    if (CHEONGAN_OHAENG[ci] === parentOh && ci % 2 === dayYy) {
      // 이 천간이 지장간 정기인 지지 찾기
      for (let ji = 0; ji < 12; ji++) {
        if (JIJI_JUNGGI[ji] === ci) targets.push(ji)
      }
    }
  }
  return targets
}

// ── 현침살 (특정 천간이 있는 위치) ──────────────────
// 甲(0), 辛(7), 壬(8), 癸(9) — 세로획이 뚜렷한 글자
const HYEONCHIM_GANS = [0, 7, 8, 9]

// ── 천살/지살 (年支 삼합 기준) ──────────────────────
const CHEONSAL: Record<number, number> = {
  2: 5, 6: 5, 10: 5, 5: 2, 9: 2, 1: 2,
  8: 11, 0: 11, 4: 11, 11: 8, 3: 8, 7: 8,
}
const JISAL: Record<number, number> = {
  2: 6, 6: 6, 10: 6, 5: 9, 9: 9, 1: 9,
  8: 0, 0: 0, 4: 0, 11: 3, 3: 3, 7: 3,
}

// ── 고신살/과숙살 (年支 기준) ───────────────────────
const GOSIN: Record<number, number> = {
  2: 5, 3: 5, 4: 5, 5: 8, 6: 8, 7: 8,
  8: 11, 9: 11, 10: 11, 11: 2, 0: 2, 1: 2,
}
const GWASUK: Record<number, number> = {
  2: 1, 3: 1, 4: 1, 5: 4, 6: 4, 7: 4,
  8: 7, 9: 7, 10: 7, 11: 10, 0: 10, 1: 10,
}

// ── 태극귀인 (日干 기준 → 지지) ────────────────────
const TAEGUEK: Record<number, number[]> = {
  0: [0, 6], 1: [0, 6], 2: [3, 9], 3: [3, 9], 4: [4, 10],
  5: [4, 10], 6: [1, 7], 7: [1, 7], 8: [2, 8], 9: [2, 8],
}

const POSITION_NAMES = ['연주', '월주', '일주', '시주']

/**
 * 전체 사주에서 신살 판별 (30종+)
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
  const monthJiIdx = pillars.wolju.jijiIdx

  const allJiji = p.map(x => x.jijiIdx)
  const allCheongan = p.map(x => x.cheonganIdx)

  function add(name: string, desc: string, effect: SinsalItem['effect'], pos: string) {
    results.push({ name, description: desc, effect, position: pos })
  }

  // ─── 길신 ─────────────────────────────────────────

  const guiinTargets = CHEONEUL_GUIIN[dayGanIdx] || []
  for (let i = 0; i < 4; i++) {
    if (guiinTargets.includes(allJiji[i]))
      add('천을귀인', '귀인의 도움을 받아 위기를 모면하고 복을 누림', 'positive', POSITION_NAMES[i])
  }

  const cheondukTarget = CHEONDUK[monthJiIdx]
  if (cheondukTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (allCheongan[i] === cheondukTarget)
        add('천덕귀인', '하늘의 덕으로 재난을 피하고 복록이 따름', 'positive', POSITION_NAMES[i])
    }
  }

  const woldukTarget = WOLDUK[monthJiIdx]
  if (woldukTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (allCheongan[i] === woldukTarget)
        add('월덕귀인', '월덕의 보호로 흉사가 줄고 만사형통', 'positive', POSITION_NAMES[i])
    }
  }

  const munchangTarget = MUNCHANG[dayGanIdx]
  for (let i = 0; i < 4; i++) {
    if (allJiji[i] === munchangTarget)
      add('문창귀인', '학문과 문필에 재능이 있어 시험운과 학업운이 좋음', 'positive', POSITION_NAMES[i])
  }

  const hakdangTarget = HAKDANG[dayGanIdx]
  for (let i = 0; i < 4; i++) {
    if (allJiji[i] === hakdangTarget)
      add('학당귀인', '학문적 재능이 뛰어나고 배움에 대한 열정이 강함', 'positive', POSITION_NAMES[i])
  }

  const geumyeoTarget = GEUMYEO[dayGanIdx]
  for (let i = 0; i < 4; i++) {
    if (allJiji[i] === geumyeoTarget)
      add('금여귀인', '금으로 만든 수레를 탈 격, 배우자운과 재물복이 좋음', 'positive', POSITION_NAMES[i])
  }

  const cheongwanTarget = CHEONGWAN[dayGanIdx]
  for (let i = 0; i < 4; i++) {
    if (allJiji[i] === cheongwanTarget)
      add('천관귀인', '관직과 직장운이 좋으며 사회적 지위가 높아짐', 'positive', POSITION_NAMES[i])
  }

  const boksungTarget = BOKSUNG[dayGanIdx]
  for (let i = 0; i < 4; i++) {
    if (allJiji[i] === boksungTarget)
      add('복성귀인', '복과 행운이 따르며 어려움 속에서도 도움을 받음', 'positive', POSITION_NAMES[i])
  }

  const taeguekTargets = TAEGUEK[dayGanIdx] || []
  for (let i = 0; i < 4; i++) {
    if (taeguekTargets.includes(allJiji[i]))
      add('태극귀인', '만물의 근원과 연결, 종교·철학·학문에 인연', 'positive', POSITION_NAMES[i])
  }

  const jangsungTarget = JANGSUNG[yearJiIdx]
  if (jangsungTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (i === 0) continue
      if (allJiji[i] === jangsungTarget)
        add('장성', '리더십이 강하고 권위가 있으며 장군의 기질', 'positive', POSITION_NAMES[i])
    }
  }

  // 천희성 (年支 기준)
  const cheonhuiTarget = CHEONHUI[yearJiIdx]
  if (cheonhuiTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (allJiji[i] === cheonhuiTarget)
        add('천희성', '경사스러운 일이 많고 기쁜 소식이 찾아옴', 'positive', POSITION_NAMES[i])
    }
  }

  // ─── 흉신 ─────────────────────────────────────────

  // 양인살
  if (dayGanIdx % 2 === 0 && YANGIN[dayGanIdx] !== undefined) {
    const target = YANGIN[dayGanIdx]
    for (let i = 0; i < 4; i++) {
      if (allJiji[i] === target)
        add('양인살', '강한 의지와 추진력이 있으나 과격해질 수 있음', 'negative', POSITION_NAMES[i])
    }
  }

  // 겁살
  const geobTarget = GEOBSAL[yearJiIdx]
  if (geobTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (i === 0) continue
      if (allJiji[i] === geobTarget)
        add('겁살', '재물 손실이나 도난을 조심해야 하며 경쟁이 심함', 'negative', POSITION_NAMES[i])
    }
  }

  // 원진살
  const wonjinTarget = WONJIN[dayJiIdx]
  if (wonjinTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (i === 2) continue
      if (allJiji[i] === wonjinTarget)
        add('원진살', '인간관계에서 갈등이 생기기 쉽고 오해를 사기 쉬움', 'negative', POSITION_NAMES[i])
    }
  }

  // 백호살 (12운성 쇠 기준)
  const baekhoTarget = BAEKHO[dayGanIdx]
  if (baekhoTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (allJiji[i] === baekhoTarget)
        add('백호살', '외과적 수술이나 사고를 조심, 단 리더십으로 쓰면 길함', 'negative', POSITION_NAMES[i])
    }
  }

  // 괴강살 — 모든 주에서 검사
  for (let i = 0; i < 4; i++) {
    if (GOEGANG_PAIRS.some(([g, j]) => allCheongan[i] === g && allJiji[i] === j))
      add('괴강살', '성격이 강직하고 결단력이 있으나 고집이 세고 극단적일 수 있음', 'neutral', POSITION_NAMES[i])
  }

  // 효신살 (편인 지지)
  const hyosinTargets = getHyosinTargets(dayGanIdx)
  for (let i = 0; i < 4; i++) {
    if (hyosinTargets.includes(allJiji[i]))
      add('효신살', '편인의 기운으로 예술·기술 재능이 있으나 모성결핍 주의', 'negative', POSITION_NAMES[i])
  }

  // 홍염살
  const hongyeomTarget = HONGYEOM[dayGanIdx]
  if (hongyeomTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (allJiji[i] === hongyeomTarget)
        add('홍염살', '이성에게 매력적이나 색정 문제에 주의, 예술적 감성이 뛰어남', 'neutral', POSITION_NAMES[i])
    }
  }

  // 고신살
  const gosinTarget = GOSIN[yearJiIdx]
  if (gosinTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (allJiji[i] === gosinTarget)
        add('고신살', '고독해지기 쉬우며 독립적 성향이 강함', 'negative', POSITION_NAMES[i])
    }
  }

  // 과숙살
  const gwasukTarget = GWASUK[yearJiIdx]
  if (gwasukTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (allJiji[i] === gwasukTarget)
        add('과숙살', '배우자와 인연이 약하거나 고독해질 수 있음', 'negative', POSITION_NAMES[i])
    }
  }

  // 현침살 — 모든 주의 천간 검사
  for (let i = 0; i < 4; i++) {
    if (HYEONCHIM_GANS.includes(allCheongan[i]))
      add('현침살', '예리한 판단력과 기술적 재능, 의료·법률·기술 분야 적성', 'neutral', POSITION_NAMES[i])
  }

  // 천라지망 — 辰巳 or 戌亥 pair
  const hasJin = allJiji.includes(4), hasSa = allJiji.includes(5)
  const hasSul = allJiji.includes(10), hasHae = allJiji.includes(11)
  if (hasJin && hasSa) {
    const pos = allJiji.indexOf(4) < allJiji.indexOf(5) ? POSITION_NAMES[allJiji.indexOf(5)] : POSITION_NAMES[allJiji.indexOf(4)]
    add('천라지망', '하늘과 땅의 그물에 걸림, 관재·구설수를 조심해야 함', 'negative', pos)
  }
  if (hasSul && hasHae) {
    const sulIdx = allJiji.indexOf(10), haeIdx = allJiji.indexOf(11)
    const pos = POSITION_NAMES[Math.max(sulIdx, haeIdx)]
    add('천라지망', '하늘과 땅의 그물에 걸림, 관재·구설수를 조심해야 함', 'negative', pos)
  }

  // ─── 중성 ─────────────────────────────────────────

  // 역마살
  const yeokmaTarget = YEOKMA[dayJiIdx]
  if (yeokmaTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (i === 2) continue
      if (allJiji[i] === yeokmaTarget)
        add('역마살', '이동과 변화가 많으며 해외 인연이 있음', 'neutral', POSITION_NAMES[i])
    }
  }

  // 도화살
  const dohwaTarget = DOHWA[dayJiIdx]
  if (dohwaTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (i === 2) continue
      if (allJiji[i] === dohwaTarget)
        add('도화살', '매력적이며 예술적 감각이 뛰어나고 대인관계가 좋음', 'neutral', POSITION_NAMES[i])
    }
  }

  // 화개살
  const hwagaeTarget = HWAGAE[dayJiIdx]
  if (hwagaeTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (i === 2) continue
      if (allJiji[i] === hwagaeTarget)
        add('화개살', '학문·종교·예술에 재능이 있으며 정신세계가 깊음', 'positive', POSITION_NAMES[i])
    }
  }

  // 반안살
  const bananTarget = BANAN[yearJiIdx]
  if (bananTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (i === 0) continue
      if (allJiji[i] === bananTarget)
        add('반안살', '안정된 직장과 자리를 얻으며 편안한 자리에 앉음', 'positive', POSITION_NAMES[i])
    }
  }

  // 천살
  const cheonsalTarget = CHEONSAL[yearJiIdx]
  if (cheonsalTarget !== undefined) {
    for (let i = 1; i < 4; i++) {
      if (allJiji[i] === cheonsalTarget)
        add('천살', '자연재해나 예기치 못한 변고를 조심', 'negative', POSITION_NAMES[i])
    }
  }

  // 지살
  const jisalTarget = JISAL[yearJiIdx]
  if (jisalTarget !== undefined) {
    for (let i = 1; i < 4; i++) {
      if (allJiji[i] === jisalTarget)
        add('지살', '여행이나 이동 중 사고 조심, 해외 인연도 있음', 'neutral', POSITION_NAMES[i])
    }
  }

  return results
}
