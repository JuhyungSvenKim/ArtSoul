/**
 * 용신(用神) 분석 — 자평명리 핵심
 *
 * 용신 = 사주 원국의 오행 밸런스를 맞추기 위해 가장 필요한 오행
 * - 억부법 기반: 일간의 강약을 판단하고 균형을 맞추는 오행을 찾음
 * - 일간이 강하면 → 설기(식상/재성/관성)가 용신
 * - 일간이 약하면 → 생조(인성/비겁)가 용신
 */

import type { Ganji, SipsungResult } from './types'
import { CHEONGAN_OHAENG, JIJI_OHAENG } from './constants'

const OHAENG_LIST = ['목', '화', '토', '금', '수'] as const
type Ohaeng = typeof OHAENG_LIST[number]

const OHAENG_IDX: Record<string, number> = { '목': 0, '화': 1, '토': 2, '금': 3, '수': 4 }

// 오행 상생: 목→화→토→금→수→목
const SAENGSAENG: Record<Ohaeng, Ohaeng> = { '목': '화', '화': '토', '토': '금', '금': '수', '수': '목' }
// 오행 상극: 목→토, 화→금, 토→수, 금→목, 수→화
const SANGGEUK: Record<Ohaeng, Ohaeng> = { '목': '토', '화': '금', '토': '수', '금': '목', '수': '화' }

// 월지 왕상 체크 — 월지의 오행이 일간 오행과 같거나 생해주면 득령
function isDeukryeong(dayOhaeng: Ohaeng, woljiOhaeng: Ohaeng): boolean {
  return dayOhaeng === woljiOhaeng || SAENGSAENG[woljiOhaeng] === dayOhaeng
}

export interface OhaengBalance {
  목: number
  화: number
  토: number
  금: number
  수: number
}

export interface YongsinResult {
  /** 일간 오행 */
  dayOhaeng: string
  /** 일간 강약 판단 */
  dayStrength: '강' | '약' | '중화'
  /** 오행 분포 (각 오행별 개수) */
  ohaengBalance: OhaengBalance
  /** 오행 분포 비율 (%) */
  ohaengPercent: OhaengBalance
  /** 용신 오행 */
  yongsin: string
  /** 용신 설명 */
  yongsinDescription: string
  /** 희신 (용신을 도와주는 오행) */
  huisin: string
  /** 기신 (용신을 방해하는 오행) */
  gisin: string
  /** 구신 (기신을 도와주는 오행) */
  gusin: string
  /** 일간 강약 판단 근거 */
  strengthReason: string
  /** 사주 총평 (오행/십성/용신 기반) */
  summary: string
}

/**
 * 오행 분포 계산 (천간 4 + 지지 4 = 8글자)
 */
function countOhaeng(pillars: { yeonju: Ganji; wolju: Ganji; ilju: Ganji; siju: Ganji }): OhaengBalance {
  const count: OhaengBalance = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 }
  const p = [pillars.yeonju, pillars.wolju, pillars.ilju, pillars.siju]

  for (const pillar of p) {
    const cgOhaeng = CHEONGAN_OHAENG[pillar.cheonganIdx] as Ohaeng
    const jjOhaeng = JIJI_OHAENG[pillar.jijiIdx] as Ohaeng
    count[cgOhaeng]++
    count[jjOhaeng]++
  }

  return count
}

/**
 * 일간 강약 판단 (억부법)
 *
 * 강한 조건: 득령(월지) + 득지(지지) + 득세(천간)
 * - 득령: 월지가 일간을 생하거나 같은 오행
 * - 득지: 지지 중 일간과 같거나 생하는 오행 2개 이상
 * - 득세: 천간 중 일간과 같거나 생하는 오행 2개 이상
 */
function judgeDayStrength(
  dayOhaeng: Ohaeng,
  pillars: { yeonju: Ganji; wolju: Ganji; ilju: Ganji; siju: Ganji },
): { strength: '강' | '약' | '중화'; reason: string } {
  const p = [pillars.yeonju, pillars.wolju, pillars.ilju, pillars.siju]
  const woljiOhaeng = JIJI_OHAENG[pillars.wolju.jijiIdx] as Ohaeng

  // 1) 득령 체크
  const deukryeong = isDeukryeong(dayOhaeng, woljiOhaeng)

  // 2) 득지 체크 (지지 중 일간을 생하거나 비겁인 개수)
  let jijiSupport = 0
  for (const pillar of p) {
    const jjOhaeng = JIJI_OHAENG[pillar.jijiIdx] as Ohaeng
    if (jjOhaeng === dayOhaeng || SAENGSAENG[jjOhaeng] === dayOhaeng) {
      jijiSupport++
    }
  }
  const deukji = jijiSupport >= 2

  // 3) 득세 체크 (천간 중 비겁/인성 개수, 일간 자신 제외)
  let cheonganSupport = 0
  for (let i = 0; i < 4; i++) {
    if (i === 2) continue // 일간 자신 제외
    const cgOhaeng = CHEONGAN_OHAENG[p[i].cheonganIdx] as Ohaeng
    if (cgOhaeng === dayOhaeng || SAENGSAENG[cgOhaeng] === dayOhaeng) {
      cheonganSupport++
    }
  }
  const deukse = cheonganSupport >= 1

  const supportCount = (deukryeong ? 1 : 0) + (deukji ? 1 : 0) + (deukse ? 1 : 0)

  const reasons: string[] = []
  reasons.push(deukryeong ? `득령(월지 ${woljiOhaeng}이 ${dayOhaeng}을 생조)` : `실령(월지 ${woljiOhaeng}이 ${dayOhaeng}을 생조하지 않음)`)
  reasons.push(deukji ? `득지(지지 지원 ${jijiSupport}개)` : `실지(지지 지원 ${jijiSupport}개)`)
  reasons.push(deukse ? `득세(천간 지원 ${cheonganSupport}개)` : `실세(천간 지원 ${cheonganSupport}개)`)

  if (supportCount >= 2) {
    return { strength: '강', reason: reasons.join(', ') }
  } else if (supportCount === 1) {
    return { strength: '중화', reason: reasons.join(', ') }
  } else {
    return { strength: '약', reason: reasons.join(', ') }
  }
}

/**
 * 용신 결정 (억부법)
 */
function determineYongsin(dayOhaeng: Ohaeng, strength: '강' | '약' | '중화', balance: OhaengBalance): {
  yongsin: Ohaeng
  huisin: Ohaeng
  gisin: Ohaeng
  gusin: Ohaeng
  description: string
} {
  if (strength === '강') {
    // 일간이 강하면 → 설기/극 필요
    // 우선순위: 재성(내가 극하는) > 식상(내가 생하는) > 관성(나를 극하는)
    const jaeohaeng = SANGGEUK[dayOhaeng]         // 내가 극하는 = 재성
    const siksangohaeng = SAENGSAENG[dayOhaeng]   // 내가 생하는 = 식상
    const gwanohaeng = Object.entries(SANGGEUK).find(([_, v]) => v === dayOhaeng)?.[0] as Ohaeng // 나를 극하는 = 관성

    // 가장 부족한 것이 용신
    const candidates = [
      { ohaeng: siksangohaeng, count: balance[siksangohaeng], label: '식상' },
      { ohaeng: jaeohaeng, count: balance[jaeohaeng], label: '재성' },
      { ohaeng: gwanohaeng, count: balance[gwanohaeng], label: '관성' },
    ].sort((a, b) => a.count - b.count)

    const yongsin = candidates[0].ohaeng
    const huisin = SAENGSAENG[Object.entries(SAENGSAENG).find(([_, v]) => v === yongsin)?.[0] as Ohaeng || dayOhaeng] || yongsin

    // 기신 = 용신을 극하는 오행
    const gisin = Object.entries(SANGGEUK).find(([_, v]) => v === yongsin)?.[0] as Ohaeng || dayOhaeng
    const gusin = SAENGSAENG[Object.entries(SAENGSAENG).find(([_, v]) => v === gisin)?.[0] as Ohaeng || dayOhaeng] || dayOhaeng

    return {
      yongsin,
      huisin: SAENGSAENG[yongsin] || yongsin, // 용신이 생하는 오행 = 희신도 가능, but 전통적으로는 용신을 생하는게 희신
      gisin,
      gusin,
      description: `일간(${dayOhaeng})이 강하여 ${candidates[0].label}(${yongsin})으로 설기하여 균형을 잡음`,
    }
  } else {
    // 일간이 약하면 → 생조 필요
    // 우선순위: 인성(나를 생하는) > 비겁(같은 오행)
    const insungohaeng = Object.entries(SAENGSAENG).find(([_, v]) => v === dayOhaeng)?.[0] as Ohaeng
    const bigeop = dayOhaeng

    const yongsin = balance[insungohaeng] <= balance[bigeop] ? insungohaeng : insungohaeng

    // 희신 = 용신을 생해주는 오행
    const huisin = Object.entries(SAENGSAENG).find(([_, v]) => v === yongsin)?.[0] as Ohaeng || dayOhaeng

    // 기신 = 일간을 극하는 오행 (관성)
    const gisin = Object.entries(SANGGEUK).find(([_, v]) => v === dayOhaeng)?.[0] as Ohaeng || dayOhaeng
    const gusin = SAENGSAENG[gisin] || gisin

    return {
      yongsin,
      huisin,
      gisin,
      gusin,
      description: `일간(${dayOhaeng})이 약하여 인성(${yongsin})으로 생조하여 힘을 보충함`,
    }
  }
}

/**
 * 사주 총평 생성 (오행/십성/용신 기반)
 */
function generateSummary(
  dayOhaeng: Ohaeng,
  strength: '강' | '약' | '중화',
  balance: OhaengBalance,
  yongsin: Ohaeng,
  sipsung: SipsungResult,
): string {
  // 오행 과다/부족 분석
  const total = Object.values(balance).reduce((a, b) => a + b, 0)
  const excessOhaeng = OHAENG_LIST.filter(o => balance[o] >= 3)
  const lackOhaeng = OHAENG_LIST.filter(o => balance[o] === 0)

  const parts: string[] = []

  // 일간 성향
  const dayTraits: Record<Ohaeng, string> = {
    '목': '성장·인의·추진력의 기운으로, 곧고 바르며 새로운 것을 시작하는 힘이 강함',
    '화': '열정·예의·표현력의 기운으로, 밝고 화려하며 사람들을 이끄는 카리스마가 있음',
    '토': '신뢰·중용·포용의 기운으로, 중심을 잡고 사람들을 모으는 안정감이 있음',
    '금': '결단·의리·정밀함의 기운으로, 날카로운 판단력과 원칙을 중시하는 성향',
    '수': '지혜·유연·적응력의 기운으로, 깊은 사고력과 변화에 대한 적응력이 뛰어남',
  }
  parts.push(`일간 ${dayOhaeng}(${dayTraits[dayOhaeng]})`)

  // 강약
  if (strength === '강') {
    parts.push('일간이 강하여 에너지가 넘치므로, 이를 적절히 발산하고 활용하는 것이 중요합니다')
  } else if (strength === '약') {
    parts.push('일간이 약하여 외부의 도움과 내면의 힘을 기르는 것이 중요합니다')
  } else {
    parts.push('일간이 중화를 이루어 균형 잡힌 기운을 가지고 있습니다')
  }

  // 오행 과부족
  if (excessOhaeng.length > 0) {
    parts.push(`${excessOhaeng.join('·')} 오행이 과다하여 해당 기운의 조절이 필요`)
  }
  if (lackOhaeng.length > 0) {
    parts.push(`${lackOhaeng.join('·')} 오행이 부족하여 보충이 필요`)
  }

  // 용신
  parts.push(`용신은 ${yongsin}으로, ${yongsin} 오행을 강화하는 환경·직업·색상이 유리합니다`)

  // 십성 기반 성향 요약
  const sipsungAll = [sipsung.yeonjuCg, sipsung.yeonjuJj, sipsung.woljuCg, sipsung.woljuJj, sipsung.iljuJj, sipsung.sijuCg, sipsung.sijuJj]
  const sipsungCount: Record<string, number> = {}
  for (const s of sipsungAll) {
    sipsungCount[s] = (sipsungCount[s] || 0) + 1
  }
  const dominant = Object.entries(sipsungCount).sort((a, b) => b[1] - a[1])[0]
  if (dominant) {
    const sipsungTraits: Record<string, string> = {
      '비견': '독립적이고 자존심이 강하며 경쟁심이 있음',
      '겁재': '사교적이고 대담하나 재물 관리에 주의 필요',
      '식신': '먹복과 표현력이 좋으며 창의적 재능이 있음',
      '상관': '말재주와 재능이 뛰어나나 관계 충돌에 주의',
      '편재': '사업 수완이 좋고 돈을 잘 굴리나 투기 주의',
      '정재': '안정적 재물운이 있으며 성실하게 모으는 스타일',
      '편관': '권위와 추진력이 강하나 스트레스 관리 필요',
      '정관': '질서와 명예를 중시하며 공직·관직에 인연',
      '편인': '독특한 사고와 학습력이 있으나 변덕 주의',
      '정인': '학문적 재능과 어머니 복이 있으며 인자함',
    }
    parts.push(`십성 중 ${dominant[0]}이 가장 많아(${dominant[1]}개) — ${sipsungTraits[dominant[0]] || ''}`)
  }

  return parts.join('. ') + '.'
}

/**
 * 용신 분석 메인 함수
 */
export function analyzeYongsin(
  pillars: { yeonju: Ganji; wolju: Ganji; ilju: Ganji; siju: Ganji },
  sipsung: SipsungResult,
): YongsinResult {
  const dayOhaeng = CHEONGAN_OHAENG[pillars.ilju.cheonganIdx] as Ohaeng
  const balance = countOhaeng(pillars)
  const total = Object.values(balance).reduce((a, b) => a + b, 0)
  const percent: OhaengBalance = {
    목: Math.round(balance.목 / total * 100),
    화: Math.round(balance.화 / total * 100),
    토: Math.round(balance.토 / total * 100),
    금: Math.round(balance.금 / total * 100),
    수: Math.round(balance.수 / total * 100),
  }

  const { strength, reason } = judgeDayStrength(dayOhaeng, pillars)
  const { yongsin, huisin, gisin, gusin, description } = determineYongsin(dayOhaeng, strength, balance)
  const summary = generateSummary(dayOhaeng, strength, balance, yongsin, sipsung)

  return {
    dayOhaeng,
    dayStrength: strength,
    ohaengBalance: balance,
    ohaengPercent: percent,
    yongsin,
    yongsinDescription: description,
    huisin,
    gisin,
    gusin,
    strengthReason: reason,
    summary,
  }
}
