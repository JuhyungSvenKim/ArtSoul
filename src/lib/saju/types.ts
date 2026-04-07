import type { TwelveStage } from './twelve-stages'
import type { Gongmang } from './gongmang'
import type { RelationItem } from './relations'
import type { GyeokgukResult } from './gyeokguk'
import type { SinsalItem, SinsalByPillar, PillarInterpretation } from './sinsal'

// ── 사주 입력 ────────────────────────────────────────
export interface SajuInput {
  year: number
  month: number
  day: number
  hour: number          // 0~23
  gender: '남' | '여'
  calendarType: '양력' | '음력'
}

// ── 간지 (하나의 기둥) ──────────────────────────────
export interface Ganji {
  cheongan: string      // 천간 한자 (甲, 乙, …)
  jiji: string          // 지지 한자 (子, 丑, …)
  cheonganKor: string   // 천간 한글 (갑, 을, …)
  jijiKor: string       // 지지 한글 (자, 축, …)
  cheonganIdx: number   // 천간 인덱스 (0~9)
  jijiIdx: number       // 지지 인덱스 (0~11)
  ohaeng: string        // 천간 오행 (목, 화, 토, 금, 수)
  jijiOhaeng: string    // 지지 오행
}

// ── 십성 결과 ────────────────────────────────────────
export interface SipsungResult {
  yeonjuCg: string      // 연주 천간 십성
  yeonjuJj: string      // 연주 지지 십성 (지장간 정기 기준)
  woljuCg: string       // 월주 천간 십성
  woljuJj: string       // 월주 지지 십성
  iljuJj: string        // 일주 지지 십성
  sijuCg: string        // 시주 천간 십성
  sijuJj: string        // 시주 지지 십성
}

// ── 12운성 결과 ──────────────────────────────────────
export interface TwelveStagesResult {
  yeonjuCg: TwelveStage
  yeonjuJj: TwelveStage
  woljuCg: TwelveStage
  woljuJj: TwelveStage
  iljuJj: TwelveStage
  sijuCg: TwelveStage
  sijuJj: TwelveStage
}

// ── 대운 아이템 ──────────────────────────────────────
export interface DaeunItem {
  ganji: Ganji
  startAge: number
  endAge: number
}

// ── 사주 결과 (전체) ─────────────────────────────────
export interface SajuResult {
  input: SajuInput
  solarDate: { year: number; month: number; day: number }
  yeonju: Ganji
  wolju: Ganji
  ilju: Ganji
  siju: Ganji
  sipsung: SipsungResult
  twelveStages: TwelveStagesResult
  gyeokguk: GyeokgukResult
  sinsal: SinsalItem[]
  sinsalByPillar: SinsalByPillar
  pillarInterpretations: PillarInterpretation[]
  gongmang: Gongmang
  relations: RelationItem[]
  daeun: DaeunItem[]
  daeunStartAge: number
  jeolgiName: string
}
