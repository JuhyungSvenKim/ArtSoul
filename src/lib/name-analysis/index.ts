/**
 * 성명학 종합 분석 entry point
 */
import type { Ohaeng } from '@/types/ohaeng'
import type { FullNameAnalysis, NameAnalysisInput } from './types'
import { analyzeSoundOhaeng, analyzeSuri, analyzeJawonOhaeng, matchYongsin, getHanjaStrokes } from './engine'

export function analyzeFullName(input: NameAnalysisInput): FullNameAnalysis {
  const { nameKorean, nameHanja, surnameLength = 1, yongsinElement } = input

  // 1. 음향오행 (항상 가능)
  const soundOhaeng = analyzeSoundOhaeng(nameKorean)

  // 2~3. 한자 기반 분석 (한자 있을 때만)
  let suriResult = null
  let jawonOhaeng = null

  if (nameHanja) {
    // 한자 문자열에서 공백 제거 후 글자 분리
    const hanjaChars = nameHanja.replace(/\s+/g, '')

    if (hanjaChars.length >= 2) {
      // 획수 조회
      const strokes: number[] = []
      for (const ch of hanjaChars) {
        const s = getHanjaStrokes(ch)
        strokes.push(s ?? 0)
      }

      // 성 / 이름 분리
      const surnameStrokes = strokes.slice(0, surnameLength).reduce((a, b) => a + b, 0)
      const nameStrokes = strokes.slice(surnameLength)

      if (surnameStrokes > 0 && nameStrokes.length > 0 && nameStrokes[0] > 0) {
        suriResult = analyzeSuri(
          surnameStrokes,
          nameStrokes[0],
          nameStrokes.length > 1 ? (nameStrokes[1] || 0) : 0,
        )
      }

      // 자원오행
      jawonOhaeng = analyzeJawonOhaeng(hanjaChars)
    }
  }

  // 4. 사주용신 매칭
  let yongsinMatch = null
  if (yongsinElement) {
    // 이름의 모든 오행 수집 (음향 + 자원)
    const allOhaengs: Ohaeng[] = [...soundOhaeng.flow]
    if (jawonOhaeng) allOhaengs.push(...jawonOhaeng.flow)
    yongsinMatch = matchYongsin(allOhaengs, yongsinElement)
  }

  // 종합 점수 계산
  let totalWeight = 0
  let totalScore = 0

  // 음향오행 (30%)
  totalScore += soundOhaeng.score * 30
  totalWeight += 30

  if (suriResult) {
    // 수리 (40%)
    totalScore += suriResult.overallScore * 40
    totalWeight += 40
  }
  if (jawonOhaeng && jawonOhaeng.chars.length > 0) {
    // 자원오행 (20%)
    totalScore += jawonOhaeng.score * 20
    totalWeight += 20
  }
  if (yongsinMatch) {
    // 용신매칭 (10%)
    totalScore += yongsinMatch.compatibility * 10
    totalWeight += 10
  }

  const overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50

  // 등급
  let overallGrade: FullNameAnalysis['overallGrade'] = 'C'
  if (overallScore >= 90) overallGrade = 'S'
  else if (overallScore >= 75) overallGrade = 'A'
  else if (overallScore >= 60) overallGrade = 'B'
  else if (overallScore >= 40) overallGrade = 'C'
  else overallGrade = 'D'

  // 요약
  const summaryParts: string[] = []
  summaryParts.push(`음향오행: ${soundOhaeng.flow.join('→')} (${soundOhaeng.score}점)`)
  if (suriResult) summaryParts.push(`수리: ${suriResult.overallRating} (${suriResult.overallScore}점)`)
  if (jawonOhaeng && jawonOhaeng.chars.length > 0) summaryParts.push(`자원오행: ${jawonOhaeng.flow.join('→')} (${jawonOhaeng.score}점)`)
  if (yongsinMatch) summaryParts.push(`용신매칭: ${yongsinMatch.matchType} (${yongsinMatch.compatibility}점)`)

  return {
    nameKorean,
    nameHanja: nameHanja || null,
    soundOhaeng,
    spiResult: suriResult,
    jawonOhaeng,
    yongsinMatch,
    overallScore,
    overallGrade,
    summary: summaryParts.join(' | '),
  }
}

export type { FullNameAnalysis, NameAnalysisInput } from './types'
export type { SoundOhaengResult, SuriResult, JawonOhaengResult, YongsinMatchResult } from './types'
