/**
 * 125 Case Code System — 메인 진입점
 */

export type {
  OhaengElement, EnergyLevel, StyleCode,
  CaseCode, BaseCase, Artwork, ArtworkInsert, SpaceType,
} from './types'

export {
  ELEMENT_MAP, OHAENG_TO_ELEMENT,
  ENERGY_MAP, STYLE_MAP,
  SPACE_TYPES,
  buildCaseCode, parseCaseCode,
  buildBaseCode, getAllBaseCases, getAllCaseCodes,
} from './types'

export type {
  MatchingInput, MatchResult, RecommendationResult, SajuProfile,
} from './matching-engine'

export {
  matchSajuToCases, matchArtworks, getTopBaseCases,
} from './matching-engine'

export type { BaseCasePrompt } from './prompts'
export { BASE_CASE_PROMPTS, getPromptByBaseCode } from './prompts'
