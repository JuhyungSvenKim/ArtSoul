/**
 * 격국(格局) 판별 — 월지 지장간 정기 투간 기준
 *
 * 1. 월지 지장간의 정기(正氣)가 천간에 투간되었는지 확인
 * 2. 정기 투간 → 정기의 십성이 격국
 * 3. 정기 미투간 → 중기 투간 확인
 * 4. 중기 미투간 → 여기 투간 확인
 * 5. 모두 미투간 → 월지 정기의 십성을 격국으로 잡음
 *
 * 비견/겁재 → 건록격 또는 양인격으로 별도 처리
 */

import type { Ganji } from './types'
import {
  CHEONGAN_OHAENG, CHEONGAN_EUMYANG,
  JIJANGGAN, JIJI_JUNGGI,
} from './constants'

export interface GyeokgukResult {
  name: string
  description: string
  baseSipsung: string   // 격국의 기반 십성
  method: string        // 'junggi' | 'junggi_tugan' | 'junggi_default' 등
}

// 건록지 (일간별 건록 지지 인덱스)
const GEONROK_BRANCH: Record<number, number> = {
  0: 2,  // 갑 → 인
  1: 3,  // 을 → 묘
  2: 5,  // 병 → 사
  3: 6,  // 정 → 오
  4: 5,  // 무 → 사
  5: 6,  // 기 → 오
  6: 8,  // 경 → 신
  7: 9,  // 신 → 유
  8: 11, // 임 → 해
  9: 0,  // 계 → 자
}

// 양인지 (양간만)
const YANGIN_BRANCH: Record<number, number> = {
  0: 3,  // 갑 → 묘
  2: 6,  // 병 → 오
  4: 6,  // 무 → 오
  6: 9,  // 경 → 유
  8: 0,  // 임 → 자
}

const OHAENG_MAP: Record<string, number> = { '목': 0, '화': 1, '토': 2, '금': 3, '수': 4 }
const RELATION: number[][] = [
  [0, 1, 2, 3, 4],
  [4, 0, 1, 2, 3],
  [3, 4, 0, 1, 2],
  [2, 3, 4, 0, 1],
  [1, 2, 3, 4, 0],
]
const SIPSUNG_NAMES = [
  '비견','겁재','식신','상관','편재','정재','편관','정관','편인','정인',
]

function getSipsungName(dayGanIdx: number, targetGanIdx: number): string {
  const dayOh = OHAENG_MAP[CHEONGAN_OHAENG[dayGanIdx]]
  const targetOh = OHAENG_MAP[CHEONGAN_OHAENG[targetGanIdx]]
  const relation = RELATION[dayOh][targetOh]
  const sameEy = CHEONGAN_EUMYANG[dayGanIdx] === CHEONGAN_EUMYANG[targetGanIdx]
  return SIPSUNG_NAMES[relation * 2 + (sameEy ? 0 : 1)]
}

const GYEOKGUK_DESCRIPTIONS: Record<string, string> = {
  '정관격': '질서와 규범을 중시하며 명예와 직장운이 좋음',
  '편관격': '결단력과 추진력이 강하며 리더십이 있음',
  '정인격': '학문과 교육에 재능이 있으며 어머니의 덕이 있음',
  '편인격': '독창적 사고와 학구열이 강하며 특수 재능이 있음',
  '식신격': '표현력이 풍부하고 음식·예술적 감각이 뛰어남',
  '상관격': '창의적이고 파격적이며 기존 틀을 깨는 혁신가',
  '정재격': '성실하고 계획적이며 안정적 재물운이 있음',
  '편재격': '사업 수완이 좋고 유연하며 대인관계가 넓음',
  '건록격': '자수성가형으로 독립적이며 자신의 힘으로 성취',
  '양인격': '강한 의지와 결단력을 지니며 승부욕이 강함',
}

/**
 * 격국 판별
 */
export function getGyeokguk(
  ilju: Ganji,
  wolju: Ganji,
  yeonju: Ganji,
  siju: Ganji,
): GyeokgukResult {
  const dayGanIdx = ilju.cheonganIdx
  const woljiIdx = wolju.jijiIdx

  // 1) 건록격/양인격 우선 판별
  if (woljiIdx === GEONROK_BRANCH[dayGanIdx]) {
    return {
      name: '건록격',
      description: GYEOKGUK_DESCRIPTIONS['건록격'],
      baseSipsung: '비견',
      method: 'geonrok',
    }
  }
  if (dayGanIdx % 2 === 0 && YANGIN_BRANCH[dayGanIdx] === woljiIdx) {
    return {
      name: '양인격',
      description: GYEOKGUK_DESCRIPTIONS['양인격'],
      baseSipsung: '겁재',
      method: 'yangin',
    }
  }

  // 2) 월지 지장간에서 투간 확인
  const jijanggan = JIJANGGAN[woljiIdx]
  const [yeogi, junggi, jeonggi] = jijanggan
  const tianGans = [yeonju.cheonganIdx, wolju.cheonganIdx, siju.cheonganIdx] // 일간 제외

  // 정기 투간 확인
  for (const jgIdx of jeonggi) {
    if (tianGans.includes(jgIdx)) {
      const sipsung = getSipsungName(dayGanIdx, jgIdx)
      if (sipsung !== '비견' && sipsung !== '겁재') {
        return {
          name: `${sipsung}격`,
          description: GYEOKGUK_DESCRIPTIONS[`${sipsung}격`] || '',
          baseSipsung: sipsung,
          method: 'jeonggi_tugan',
        }
      }
    }
  }

  // 중기 투간 확인
  for (const jgIdx of junggi) {
    if (tianGans.includes(jgIdx)) {
      const sipsung = getSipsungName(dayGanIdx, jgIdx)
      if (sipsung !== '비견' && sipsung !== '겁재') {
        return {
          name: `${sipsung}격`,
          description: GYEOKGUK_DESCRIPTIONS[`${sipsung}격`] || '',
          baseSipsung: sipsung,
          method: 'junggi_tugan',
        }
      }
    }
  }

  // 여기 투간 확인
  for (const jgIdx of yeogi) {
    if (tianGans.includes(jgIdx)) {
      const sipsung = getSipsungName(dayGanIdx, jgIdx)
      if (sipsung !== '비견' && sipsung !== '겁재') {
        return {
          name: `${sipsung}격`,
          description: GYEOKGUK_DESCRIPTIONS[`${sipsung}격`] || '',
          baseSipsung: sipsung,
          method: 'yeogi_tugan',
        }
      }
    }
  }

  // 5) 투간 없으면 월지 정기의 십성
  const defaultGanIdx = JIJI_JUNGGI[woljiIdx]
  const sipsung = getSipsungName(dayGanIdx, defaultGanIdx)
  return {
    name: `${sipsung}격`,
    description: GYEOKGUK_DESCRIPTIONS[`${sipsung}격`] || '',
    baseSipsung: sipsung,
    method: 'jeonggi_default',
  }
}
