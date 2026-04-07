/**
 * 신살(神殺) 판별 — 삼합 기준 정통 방식
 * 주별(연주/월주/일주/시주) 그룹핑 + 확장 신살
 */

import type { Ganji } from './types'

export interface SinsalItem {
  name: string
  description: string
  effect: 'positive' | 'negative' | 'neutral'
  position: string   // 어느 기둥에서 발견되었는지
}

/** 주별로 그룹핑된 신살 */
export interface SinsalByPillar {
  yeonju: SinsalItem[]   // 연주 — 조상/초년운
  wolju: SinsalItem[]    // 월주 — 부모/청년운
  ilju: SinsalItem[]     // 일주 — 본인/배우자
  siju: SinsalItem[]     // 시주 — 자녀/말년운
}

/** 주별 해석 텍스트 */
export interface PillarInterpretation {
  position: string
  meaning: string          // 이 주가 나타내는 영역
  sinsalNames: string[]    // 해당 주의 신살 목록
  interpretation: string   // 신살 기반 종합 해석
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
const YEOKMA: Record<number, number> = {
  2: 8, 6: 8, 10: 8,   // 인/오/술 → 신
  5: 11, 9: 11, 1: 11,  // 사/유/축 → 해
  8: 2, 0: 2, 4: 2,     // 신/자/진 → 인
  11: 5, 3: 5, 7: 5,    // 해/묘/미 → 사
}

// ── 도화살 (日支/年支 삼합 왕지) ─────────────────────
const DOHWA: Record<number, number> = {
  2: 3, 6: 3, 10: 3,
  5: 6, 9: 6, 1: 6,
  8: 9, 0: 9, 4: 9,
  11: 0, 3: 0, 7: 0,
}

// ── 화개살 (日支/年支 삼합 묘지) ─────────────────────
const HWAGAE: Record<number, number> = {
  2: 10, 6: 10, 10: 10,
  5: 1, 9: 1, 1: 1,
  8: 4, 0: 4, 4: 4,
  11: 7, 3: 7, 7: 7,
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
  0: 5, 1: 6, 2: 8, 3: 9, 4: 8,
  5: 9, 6: 11, 7: 0, 8: 2, 9: 3,
}

// ── 학당귀인 (日干 기준, 장생지) ─────────────────────
const HAKDANG: Record<number, number> = {
  0: 11, 1: 6, 2: 2, 3: 9, 4: 2,
  5: 9, 6: 5, 7: 0, 8: 8, 9: 3,
}

// ── 금여록 (日干 기준) ──────────────────────────────
const GEUMYEOROK: Record<number, number> = {
  0: 4,   // 갑 → 진
  1: 5,   // 을 → 사
  2: 7,   // 병 → 미
  3: 8,   // 정 → 신
  4: 7,   // 무 → 미
  5: 8,   // 기 → 신
  6: 10,  // 경 → 술
  7: 11,  // 신 → 해
  8: 1,   // 임 → 축
  9: 2,   // 계 → 인
}

// ── 괴강살 (특정 일주만) ────────────────────────────
// 庚辰(경진), 庚戌(경술), 壬辰(임진), 壬戌(임술)
const GOEGANG_PAIRS: [number, number][] = [
  [6, 4],  // 경진
  [6, 10], // 경술
  [8, 4],  // 임진
  [8, 10], // 임술
]

// ── 백호대살 (日支 기준) ────────────────────────────
const BAEKHO: Record<number, number> = {
  2: 8, 3: 9, 4: 10, 5: 11, 6: 0, 7: 1,
  8: 2, 9: 3, 10: 4, 11: 5, 0: 6, 1: 7,
}

// ── 천의성 (日干 기준) ─────────────────────────────
const CHEONUI: Record<number, number> = {
  0: 11,  // 갑 → 해
  1: 0,   // 을 → 자
  2: 2,   // 병 → 인
  3: 3,   // 정 → 묘
  4: 2,   // 무 → 인
  5: 3,   // 기 → 묘
  6: 5,   // 경 → 사
  7: 6,   // 신 → 오
  8: 5,   // 임 → 사
  9: 6,   // 계 → 오
}

// ── 천주귀인 (日干 기준) ───────────────────────────
const CHEONJU: Record<number, number> = {
  0: 7,   // 갑 → 미
  1: 8,   // 을 → 신
  2: 9,   // 병 → 유
  3: 11,  // 정 → 해
  4: 9,   // 무 → 유
  5: 11,  // 기 → 해
  6: 11,  // 경 → 해
  7: 1,   // 신 → 축
  8: 3,   // 임 → 묘
  9: 5,   // 계 → 사
}

// ── 장성살 (年支 기준, 삼합 제왕지) ─────────────────
const JANGSEONG: Record<number, number> = {
  2: 6, 6: 6, 10: 6,   // 인/오/술 → 오
  5: 9, 9: 9, 1: 9,    // 사/유/축 → 유
  8: 0, 0: 0, 4: 0,    // 신/자/진 → 자
  11: 3, 3: 3, 7: 3,   // 해/묘/미 → 묘
}

// ── 겁살 (年支 기준) ───────────────────────────────
const GEOBSAL: Record<number, number> = {
  2: 5, 6: 5, 10: 5,   // 인/오/술 → 사
  5: 8, 9: 8, 1: 8,    // 사/유/축 → 신
  8: 11, 0: 11, 4: 11, // 신/자/진 → 해
  11: 2, 3: 2, 7: 2,   // 해/묘/미 → 인
}

// ── 망신살 (年支 기준) ──────────────────────────────
const MANGSIN: Record<number, number> = {
  2: 8, 6: 8, 10: 8,   // 인/오/술 → 신
  5: 11, 9: 11, 1: 11, // 사/유/축 → 해
  8: 2, 0: 2, 4: 2,    // 신/자/진 → 인
  11: 5, 3: 5, 7: 5,   // 해/묘/미 → 사
}

// ── 반안살 (年支 기준) ──────────────────────────────
const BANAN: Record<number, number> = {
  2: 7, 6: 7, 10: 7,   // 인/오/술 → 미
  5: 10, 9: 10, 1: 10, // 사/유/축 → 술
  8: 1, 0: 1, 4: 1,    // 신/자/진 → 축
  11: 4, 3: 4, 7: 4,   // 해/묘/미 → 진
}

// ── 천살 (年支 기준) ───────────────────────────────
const CHEONSAL: Record<number, number> = {
  2: 4, 6: 4, 10: 4,   // 인/오/술 → 진
  5: 7, 9: 7, 1: 7,    // 사/유/축 → 미
  8: 10, 0: 10, 4: 10, // 신/자/진 → 술
  11: 1, 3: 1, 7: 1,   // 해/묘/미 → 축
}

// ── 지살 (年支 기준) ───────────────────────────────
const JISAL: Record<number, number> = {
  2: 11, 6: 11, 10: 11, // 인/오/술 → 해
  5: 2, 9: 2, 1: 2,     // 사/유/축 → 인
  8: 5, 0: 5, 4: 5,     // 신/자/진 → 사
  11: 8, 3: 8, 7: 8,    // 해/묘/미 → 신
}

// ── 효신살 (日干 기준, 편인이 있는 지지) ─────────────
// 일간의 편인에 해당하는 지지(정기)가 사주에 있을 때
// 편인 오행: 나를 생하는 오행 중 음양 다른 것
// 간단히: 일간+2(mod5)*2 → 편인 천간 인덱스
const HYOSIN: Record<number, number[]> = {
  0: [11],     // 갑(양목) → 편인=임수 → 해(임수 장생)
  1: [0],      // 을(음목) → 편인=계수 → 자(계수)
  2: [2, 3],   // 병(양화) → 편인=갑목 → 인(갑목)
  3: [2, 3],   // 정(음화) → 편인=을목 → 묘(을목)
  4: [5, 6],   // 무(양토) → 편인=병화 → 사(병화)
  5: [5, 6],   // 기(음토) → 편인=정화 → 오(정화)
  6: [4, 7],   // 경(양금) → 편인=무토 → 진,술(무토)
  7: [1, 7],   // 신(음금) → 편인=기토 → 축,미(기토)
  8: [8, 9],   // 임(양수) → 편인=경금 → 신(경금)
  9: [8, 9],   // 계(음수) → 편인=신금 → 유(신금)
}

// ── 홍염살 (日干 기준) ──────────────────────────────
const HONGYEOM: Record<number, number> = {
  0: 6,   // 갑 → 오
  1: 8,   // 을 → 신
  2: 2,   // 병 → 인
  3: 7,   // 정 → 미
  4: 4,   // 무 → 진
  5: 4,   // 기 → 진
  6: 9,   // 경 → 유
  7: 6,   // 신 → 오
  8: 0,   // 임 → 자
  9: 8,   // 계 → 신 (일부 유파 계→사, sajuplus 기준 신)
}

// ── 천라지망 (日支 기준) ────────────────────────────
// 진술(천라), 사해(지망)
// 일지가 辰이면 戌이 천라, 일지가 巳면 亥가 지망 (역도 성립)
const CHEOLLA_JIMANG: Record<number, number[]> = {
  4: [10],  // 진 → 술(천라)
  10: [4],  // 술 → 진(천라)
  5: [11],  // 사 → 해(지망)
  11: [5],  // 해 → 사(지망)
}

// ── 천희성 (日干 기준) ──────────────────────────────
const CHEONHUI: Record<number, number> = {
  0: 2,   // 갑 → 인
  1: 3,   // 을 → 묘
  2: 5,   // 병 → 사
  3: 6,   // 정 → 오
  4: 5,   // 무 → 사
  5: 6,   // 기 → 오
  6: 8,   // 경 → 신
  7: 9,   // 신 → 유
  8: 11,  // 임 → 해
  9: 0,   // 계 → 자
}

// ── 현침살 (日干 기준) ──────────────────────────────
// 일간의 상관에 해당하는 지지가 있을 때
const HYEONCHIM: Record<number, number> = {
  0: 6,   // 갑 → 오(정화=상관)
  1: 5,   // 을 → 사(병화=상관)
  2: 10,  // 병 → 술(무토=상관, 진술 중 술)
  3: 1,   // 정 → 축(기토=상관)
  4: 8,   // 무 → 신(경금=상관)
  5: 9,   // 기 → 유(신금=상관)
  6: 0,   // 경 → 자(계수=상관)
  7: 11,  // 신 → 해(임수=상관)
  8: 3,   // 임 → 묘(을목=상관)
  9: 2,   // 계 → 인(갑목=상관)
}

// ── 태극귀인 (日干 기준) ────────────────────────────
const TAEGEUK: Record<number, number[]> = {
  0: [0, 1],   // 갑 → 자, 축
  1: [0, 1],   // 을 → 자, 축
  2: [3, 6],   // 병 → 묘, 오
  3: [3, 6],   // 정 → 묘, 오
  4: [3, 6],   // 무 → 묘, 오
  5: [3, 6],   // 기 → 묘, 오
  6: [4, 10],  // 경 → 진, 술
  7: [4, 10],  // 신 → 진, 술
  8: [2, 9],   // 임 → 인, 유
  9: [2, 9],   // 계 → 인, 유
}

const POSITION_NAMES = ['연주', '월주', '일주', '시주'] as const

/**
 * 전체 사주에서 신살 판별 — 주별 그룹핑
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

  // ── 천을귀인 ──
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

  // ── 역마살 (일지 기준) ──
  const yeokmaTarget = YEOKMA[dayJiIdx]
  if (yeokmaTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (i === 2) continue
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

  // ── 도화살 (일지 기준) ──
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

  // ── 화개살 (일지 기준) ──
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

  // ── 양인살 (양간만) ──
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

  // ── 문창귀인 ──
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

  // ── 학당귀인 ──
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

  // ── 금여록 (日干 기준) ──
  const geumyeoTarget = GEUMYEOROK[dayGanIdx]
  for (let i = 0; i < 4; i++) {
    if (allJiji[i] === geumyeoTarget) {
      results.push({
        name: '금여록',
        description: '금전적 복이 있으며 물질적 풍요를 누림. 배우자 복과 연관',
        effect: 'positive',
        position: POSITION_NAMES[i],
      })
    }
  }

  // ── 괴강살 (일주 천간+지지 조합) ──
  for (const [gan, ji] of GOEGANG_PAIRS) {
    if (dayGanIdx === gan && dayJiIdx === ji) {
      results.push({
        name: '괴강살',
        description: '성격이 강직하고 결단력이 뛰어남. 지도력은 있으나 독선적일 수 있음',
        effect: 'neutral',
        position: '일주',
      })
      break
    }
  }

  // ── 백호대살 (일지 기준) ──
  const baekhoTarget = BAEKHO[dayJiIdx]
  if (baekhoTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (i === 2) continue
      if (allJiji[i] === baekhoTarget) {
        results.push({
          name: '백호대살',
          description: '혈광지사(사고·수술)에 주의하며 강한 돌파력을 가짐',
          effect: 'negative',
          position: POSITION_NAMES[i],
        })
      }
    }
  }

  // ── 천의성 (日干 기준) ──
  const cheonuiTarget = CHEONUI[dayGanIdx]
  for (let i = 0; i < 4; i++) {
    if (allJiji[i] === cheonuiTarget) {
      results.push({
        name: '천의성',
        description: '의료·치유 분야에 재능이 있으며 건강 회복력이 좋음',
        effect: 'positive',
        position: POSITION_NAMES[i],
      })
    }
  }

  // ── 천주귀인 (日干 기준) ──
  const cheonjuTarget = CHEONJU[dayGanIdx]
  for (let i = 0; i < 4; i++) {
    if (allJiji[i] === cheonjuTarget) {
      results.push({
        name: '천주귀인',
        description: '음식·요리에 재능이 있으며 식복이 좋음',
        effect: 'positive',
        position: POSITION_NAMES[i],
      })
    }
  }

  // ── 장성살 (年支 기준) ──
  const jangseongTarget = JANGSEONG[yearJiIdx]
  if (jangseongTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (i === 0) continue
      if (allJiji[i] === jangseongTarget) {
        results.push({
          name: '장성살',
          description: '권위와 명예가 있으며 사회적 지위가 높아짐',
          effect: 'positive',
          position: POSITION_NAMES[i],
        })
      }
    }
  }

  // ── 겁살 (年支 기준) ──
  const geobsalTarget = GEOBSAL[yearJiIdx]
  if (geobsalTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (i === 0) continue
      if (allJiji[i] === geobsalTarget) {
        results.push({
          name: '겁살',
          description: '외부로부터 갑작스러운 재난이나 손실을 당할 수 있음',
          effect: 'negative',
          position: POSITION_NAMES[i],
        })
      }
    }
  }

  // ── 망신살 (年支 기준) ──
  const mangsinTarget = MANGSIN[yearJiIdx]
  if (mangsinTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (i === 0) continue
      if (allJiji[i] === mangsinTarget) {
        results.push({
          name: '망신살',
          description: '구설수와 명예 손상에 주의. 대중 앞에서 실수할 수 있음',
          effect: 'negative',
          position: POSITION_NAMES[i],
        })
      }
    }
  }

  // ── 반안살 (年支 기준) ──
  const bananTarget = BANAN[yearJiIdx]
  if (bananTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (i === 0) continue
      if (allJiji[i] === bananTarget) {
        results.push({
          name: '반안살',
          description: '안정과 편안함을 추구하며 안락한 생활을 누림',
          effect: 'positive',
          position: POSITION_NAMES[i],
        })
      }
    }
  }

  // ── 천살 (年支 기준) ──
  const cheonsalTarget = CHEONSAL[yearJiIdx]
  if (cheonsalTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (i === 0) continue
      if (allJiji[i] === cheonsalTarget) {
        results.push({
          name: '천살',
          description: '천재지변·자연재해 등 불가항력적 사건에 주의',
          effect: 'negative',
          position: POSITION_NAMES[i],
        })
      }
    }
  }

  // ── 지살 (年支 기준) ──
  const jisalTarget = JISAL[yearJiIdx]
  if (jisalTarget !== undefined) {
    for (let i = 0; i < 4; i++) {
      if (i === 0) continue
      if (allJiji[i] === jisalTarget) {
        results.push({
          name: '지살',
          description: '땅과 관련된 이동운. 이사·여행이 잦으며 부동산 인연',
          effect: 'neutral',
          position: POSITION_NAMES[i],
        })
      }
    }
  }

  // ── 효신살 (日干 기준, 편인 지지) ──
  const hyosinTargets = HYOSIN[dayGanIdx] || []
  for (let i = 0; i < 4; i++) {
    if (hyosinTargets.includes(allJiji[i])) {
      results.push({
        name: '효신살',
        description: '의심이 많고 끝맺음이 약함. 시작은 좋으나 마무리에 주의',
        effect: 'negative',
        position: POSITION_NAMES[i],
      })
    }
  }

  // ── 홍염살 (日干 기준) ──
  const hongyeomTarget = HONGYEOM[dayGanIdx]
  for (let i = 0; i < 4; i++) {
    if (allJiji[i] === hongyeomTarget) {
      results.push({
        name: '홍염살',
        description: '이성에 대한 관심이 강하며 색정으로 인한 시비에 주의. 예술적 끼가 있음',
        effect: 'neutral',
        position: POSITION_NAMES[i],
      })
    }
  }

  // ── 천라지망 (日支 기준) ──
  const cheollaTargets = CHEOLLA_JIMANG[dayJiIdx] || []
  for (let i = 0; i < 4; i++) {
    if (i === 2) continue
    if (cheollaTargets.includes(allJiji[i])) {
      results.push({
        name: '천라지망',
        description: '관재구설·소송에 주의. 법적 분쟁이 생기기 쉬우나 극복하면 성장',
        effect: 'negative',
        position: POSITION_NAMES[i],
      })
    }
  }

  // ── 천희성 (日干 기준) ──
  const cheonhuiTarget = CHEONHUI[dayGanIdx]
  for (let i = 0; i < 4; i++) {
    if (allJiji[i] === cheonhuiTarget) {
      results.push({
        name: '천희성',
        description: '경사스러운 일이 많으며 기쁜 소식과 행운이 따름',
        effect: 'positive',
        position: POSITION_NAMES[i],
      })
    }
  }

  // ── 현침살 (日干 기준) ──
  const hyeonchimTarget = HYEONCHIM[dayGanIdx]
  for (let i = 0; i < 4; i++) {
    if (allJiji[i] === hyeonchimTarget) {
      results.push({
        name: '현침살',
        description: '언변이 날카롭고 손재주가 있음. 의료·기술·예술 분야에 적합',
        effect: 'neutral',
        position: POSITION_NAMES[i],
      })
    }
  }

  // ── 태극귀인 (日干 기준) ──
  const taegeukTargets = TAEGEUK[dayGanIdx] || []
  for (let i = 0; i < 4; i++) {
    if (taegeukTargets.includes(allJiji[i])) {
      results.push({
        name: '태극귀인',
        description: '큰 뜻을 품고 성취하는 힘이 있음. 시작과 끝을 관장하는 귀인',
        effect: 'positive',
        position: POSITION_NAMES[i],
      })
    }
  }

  return results
}

/**
 * 신살을 주별로 그룹핑
 */
export function groupSinsalByPillar(sinsal: SinsalItem[]): SinsalByPillar {
  const result: SinsalByPillar = {
    yeonju: [],
    wolju: [],
    ilju: [],
    siju: [],
  }
  for (const s of sinsal) {
    switch (s.position) {
      case '연주': result.yeonju.push(s); break
      case '월주': result.wolju.push(s); break
      case '일주': result.ilju.push(s); break
      case '시주': result.siju.push(s); break
    }
  }
  return result
}

// ── 주별 해석 메타 ──────────────────────────────────
const PILLAR_META: Record<string, { key: keyof SinsalByPillar; meaning: string }> = {
  '연주': { key: 'yeonju', meaning: '조상운·초년운(0~15세). 가문의 기운과 어린 시절의 환경' },
  '월주': { key: 'wolju', meaning: '부모운·청년운(15~30세). 사회 진출과 직업, 형제 관계' },
  '일주': { key: 'ilju', meaning: '본인·배우자운(30~45세). 본인의 핵심 기질과 배우자 복' },
  '시주': { key: 'siju', meaning: '자녀운·말년운(45세~). 자녀 복과 노후의 모습' },
}

/**
 * 주별 신살 기반 해석 생성
 */
export function interpretByPillar(grouped: SinsalByPillar): PillarInterpretation[] {
  const interpretations: PillarInterpretation[] = []

  for (const [pos, meta] of Object.entries(PILLAR_META)) {
    const items = grouped[meta.key]
    const names = items.map(s => s.name)
    const positiveItems = items.filter(s => s.effect === 'positive')
    const negativeItems = items.filter(s => s.effect === 'negative')
    const neutralItems = items.filter(s => s.effect === 'neutral')

    let interpretation = ''

    if (items.length === 0) {
      interpretation = '특별한 신살이 없어 평탄한 기운입니다.'
    } else {
      const parts: string[] = []

      if (positiveItems.length > 0) {
        parts.push(`길신(${positiveItems.map(s => s.name).join('·')})이 있어 ${positiveItems.map(s => s.description).join('. ')}`)
      }
      if (negativeItems.length > 0) {
        parts.push(`흉살(${negativeItems.map(s => s.name).join('·')})이 있어 ${negativeItems.map(s => s.description).join('. ')}`)
      }
      if (neutralItems.length > 0) {
        parts.push(`${neutralItems.map(s => s.name).join('·')}이(가) 있어 ${neutralItems.map(s => s.description).join('. ')}`)
      }

      interpretation = parts.join(' 또한 ')
    }

    interpretations.push({
      position: pos,
      meaning: meta.meaning,
      sinsalNames: names,
      interpretation,
    })
  }

  return interpretations
}
