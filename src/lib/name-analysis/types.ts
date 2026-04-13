/**
 * 성명학 (Korean Name Analysis) — 타입 정의
 */
import type { Ohaeng } from '@/types/ohaeng'

// ── 음향오행 (Sound Five Elements) ──────────────────
export interface SoundOhaengChar {
  char: string          // 한글 글자
  choseong: string      // 초성 (ㄱ, ㄴ, ...)
  ohaeng: Ohaeng        // 매핑된 오행
}

export interface SoundOhaengResult {
  chars: SoundOhaengChar[]
  flow: Ohaeng[]        // 오행 흐름 (성→이름1→이름2)
  flowAnalysis: string  // 상생/상극 분석 설명
  score: number         // 0~100 점수
}

// ── 수리 81수리 (81 Stroke Numerology) ──────────────
export interface SuriGyeok {
  name: string          // 천격/인격/지격/총격/외격
  value: number         // 수리 값
  ohaeng: Ohaeng        // 수리 오행
  rating: '대길' | '길' | '반길반흉' | '흉' | '대흉'
  meaning: string       // 81수리 해석
}

export interface SuriResult {
  strokes: {
    surname: number
    name1: number
    name2: number       // 0 if 2-char name
  }
  cheongyeok: SuriGyeok  // 천격 (원격)
  ingyeok: SuriGyeok     // 인격 (형격)
  jigyeok: SuriGyeok     // 지격 (이격)
  chonggyeok: SuriGyeok  // 총격 (정격)
  oegyeok: SuriGyeok     // 외격
  overallScore: number    // 종합 점수 (0~100)
  overallRating: string   // 종합 판정
}

// ── 자원오행 (Character Five Elements) ──────────────
export interface JawonOhaengChar {
  char: string          // 한자 글자
  strokes: number       // 획수
  ohaeng: Ohaeng        // 획수 기반 오행
}

export interface JawonOhaengResult {
  chars: JawonOhaengChar[]
  flow: Ohaeng[]        // 오행 흐름
  flowAnalysis: string  // 상생/상극 분석
  score: number         // 0~100 점수
}

// ── 사주용신 매칭 ───────────────────────────────────
export interface YongsinMatchResult {
  yongsinElement: Ohaeng      // 사주의 용신 오행
  nameElements: Ohaeng[]      // 이름에서 나온 주요 오행들
  matchType: '상생' | '동일' | '무관' | '상극'
  compatibility: number       // 0~100 호환성 점수
  description: string         // 매칭 설명
  recommendation: string      // 추천 사항
}

// ── 종합 성명학 결과 ────────────────────────────────
export interface FullNameAnalysis {
  nameKorean: string
  nameHanja: string | null
  soundOhaeng: SoundOhaengResult
  spiResult: SuriResult | null        // 한자 있을 때만
  jawonOhaeng: JawonOhaengResult | null // 한자 있을 때만
  yongsinMatch: YongsinMatchResult | null // 사주 있을 때만
  overallScore: number
  overallGrade: 'S' | 'A' | 'B' | 'C' | 'D'
  summary: string
}

// ── 이름 분석 입력 ──────────────────────────────────
export interface NameAnalysisInput {
  nameKorean: string          // 한글 이름 (2~4자)
  nameHanja?: string | null   // 한자 이름 (성+이름)
  surnameLength?: number      // 성 글자 수 (기본 1)
  yongsinElement?: Ohaeng     // 사주 용신 오행
}
