/**
 * 125 Case Code System
 *
 * 오행(Element) × 에너지(Energy) × 스타일(Style) = 5 × 5 × 5 = 125 케이스
 *
 * Element: W(목/Wood), F(화/Fire), E(토/Earth), M(금/Metal), A(수/Water)
 * Energy: 1(여백형), 2(균형형), 3(역동형), 4(유동형), 5(밀도형)
 * Style: S1(고전 품위), S2(전통 동양), S3(현대 미니멀), S4(팝/현대), S5(프리미엄 유니크)
 */

// ── Element (오행) ──────────────────────────────────
export type OhaengElement = 'W' | 'F' | 'E' | 'M' | 'A'

export const ELEMENT_MAP: Record<OhaengElement, { ohaeng: string; label: string; labelKor: string; color: string; colorGradient: [string, string] }> = {
  W: { ohaeng: '목', label: 'Wood', labelKor: '목(木)', color: '#4a9e6e', colorGradient: ['#2d6e4a', '#6bc48e'] },
  F: { ohaeng: '화', label: 'Fire', labelKor: '화(火)', color: '#d45050', colorGradient: ['#a03030', '#f07070'] },
  E: { ohaeng: '토', label: 'Earth', labelKor: '토(土)', color: '#c49a3c', colorGradient: ['#8a6a1c', '#e4ba5c'] },
  M: { ohaeng: '금', label: 'Metal', labelKor: '금(金)', color: '#a0a0a0', colorGradient: ['#707070', '#d0d0d0'] },
  A: { ohaeng: '수', label: 'Water', labelKor: '수(水)', color: '#4a7eb5', colorGradient: ['#2a5e95', '#6a9ed5'] },
}

export const OHAENG_TO_ELEMENT: Record<string, OhaengElement> = {
  '목': 'W', '화': 'F', '토': 'E', '금': 'M', '수': 'A',
}

// ── Energy (에너지 레벨 1~5) ────────────────────────
export type EnergyLevel = 1 | 2 | 3 | 4 | 5

export const ENERGY_MAP: Record<EnergyLevel, { label: string; labelKor: string; description: string; keywords: string[] }> = {
  1: { label: 'Minimal', labelKor: '여백형', description: '고요하고 정적인 에너지, 쉼과 명상', keywords: ['진정', '수면', '안정', '명상', '휴식'] },
  2: { label: 'Balanced', labelKor: '균형형', description: '안정적이고 조화로운 에너지, 균형과 질서', keywords: ['안정', '조직', '가족', '사업안정', '관리'] },
  3: { label: 'Dynamic', labelKor: '역동형', description: '활발하고 추진하는 에너지, 성장과 확장', keywords: ['추진', '사업확장', '리더십', '성장', '도전'] },
  4: { label: 'Flowing', labelKor: '유동형', description: '흐르고 연결하는 에너지, 소통과 감성', keywords: ['관계', '소통', '감정', '커뮤니케이션', '연결'] },
  5: { label: 'Dense', labelKor: '밀도형', description: '집중되고 응축된 에너지, 축적과 전문성', keywords: ['재물', '전문성', '집중', '축적', '구조화'] },
}

// ── Style (스타일 S1~S5) ────────────────────────────
export type StyleCode = 'S1' | 'S2' | 'S3' | 'S4' | 'S5'

export const STYLE_MAP: Record<StyleCode, { label: string; labelKor: string; description: string; keywords: string[] }> = {
  S1: { label: 'Classic', labelKor: '고전 품위', description: '클래식, 아카데미, 르네상스 스타일', keywords: ['격식', '선물', '품위', '고전', '명화'] },
  S2: { label: 'Oriental', labelKor: '전통 동양', description: '수묵화, 동양 전통, 서예적', keywords: ['전통', '명상', '동양', '수묵', '절제'] },
  S3: { label: 'Modern', labelKor: '현대 미니멀', description: '모던, 미니멀, 인테리어 아트', keywords: ['미니멀', '모던', '인테리어', '범용', '깔끔'] },
  S4: { label: 'Pop', labelKor: '팝/현대', description: '팝아트, 그래픽, 현대미술', keywords: ['젊음', '존재감', '상업', '트렌디', '대담'] },
  S5: { label: 'Premium', labelKor: '프리미엄 유니크', description: '컬렉터급, 고급 오브제, 유니크', keywords: ['고급', '유니크', '컬렉터', '아트피스', '희소'] },
}

// ── Case Code ───────────────────────────────────────
export interface CaseCode {
  element: OhaengElement
  energy: EnergyLevel
  style: StyleCode
  code: string  // e.g. "W1-S2"
}

export function buildCaseCode(element: OhaengElement, energy: EnergyLevel, style: StyleCode): string {
  return `${element}${energy}-${style}`
}

export function parseCaseCode(code: string): CaseCode | null {
  const match = code.match(/^([WFEMA])([1-5])-S([1-5])$/)
  if (!match) return null
  return {
    element: match[1] as OhaengElement,
    energy: parseInt(match[2]) as EnergyLevel,
    style: `S${match[3]}` as StyleCode,
    code,
  }
}

// ── Base Case (25개: Element × Energy) ──────────────
export interface BaseCase {
  element: OhaengElement
  energy: EnergyLevel
  baseCode: string  // e.g. "W1"
  label: string
  description: string
}

export function buildBaseCode(element: OhaengElement, energy: EnergyLevel): string {
  return `${element}${energy}`
}

export function getAllBaseCases(): BaseCase[] {
  const cases: BaseCase[] = []
  const elements: OhaengElement[] = ['W', 'F', 'E', 'M', 'A']
  const energies: EnergyLevel[] = [1, 2, 3, 4, 5]

  for (const el of elements) {
    for (const en of energies) {
      cases.push({
        element: el,
        energy: en,
        baseCode: buildBaseCode(el, en),
        label: `${ELEMENT_MAP[el].labelKor} × ${ENERGY_MAP[en].labelKor}`,
        description: `${ELEMENT_MAP[el].label} element with ${ENERGY_MAP[en].label} energy`,
      })
    }
  }
  return cases
}

export function getAllCaseCodes(): string[] {
  const codes: string[] = []
  const elements: OhaengElement[] = ['W', 'F', 'E', 'M', 'A']
  const energies: EnergyLevel[] = [1, 2, 3, 4, 5]
  const styles: StyleCode[] = ['S1', 'S2', 'S3', 'S4', 'S5']

  for (const el of elements) {
    for (const en of energies) {
      for (const st of styles) {
        codes.push(buildCaseCode(el, en, st))
      }
    }
  }
  return codes
}

// ── Artwork 타입 ────────────────────────────────────
export interface Artwork {
  id: string
  title: string
  artist: string
  description: string
  case_code: string
  element: OhaengElement
  energy: EnergyLevel
  style: StyleCode
  image_url: string | null
  tags: string[]
  space_type: string | null  // 거실, 침실, 사무실, 상업공간, etc.
  price_range: string | null
  created_at: string
  updated_at: string
}

export interface ArtworkInsert {
  title: string
  artist: string
  description: string
  element: OhaengElement
  energy: EnergyLevel
  style: StyleCode
  image_url?: string | null
  tags?: string[]
  space_type?: string | null
  price_range?: string | null
}

// ── 공간 타입 ───────────────────────────────────────
export type SpaceType = '거실' | '침실' | '서재' | '사무실' | '상업공간' | '카페' | '로비' | '기타'

export const SPACE_TYPES: SpaceType[] = ['거실', '침실', '서재', '사무실', '상업공간', '카페', '로비', '기타']
