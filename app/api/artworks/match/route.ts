/**
 * POST /api/artworks/match — 사주 기반 작품 매칭
 *
 * Body:
 *   - sajuInput: { year, month, day, hour, gender, calendarType }
 *   - purpose?: string
 *   - spaceType?: string
 *   - stylePreference?: string
 *   - mode?: 'complement' | 'enhance' | 'both'
 *   - limit?: number
 */
import { createClient } from '@supabase/supabase-js'
import { getSaju } from '@/lib/saju'
import { matchSajuToCases, matchArtworks, getTopBaseCases } from '@/lib/case-code'
import type { MatchingInput, SpaceType, StyleCode } from '@/lib/case-code'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase not configured')
  return createClient(url, key)
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { sajuInput, purpose, spaceType, stylePreference, mode, limit = 20 } = body

    if (!sajuInput?.year || !sajuInput?.month || !sajuInput?.day) {
      return Response.json({ success: false, error: 'sajuInput (year, month, day, hour, gender, calendarType) 필수' }, { status: 400, headers: CORS })
    }

    // 1) 사주 계산
    const sajuResult = getSaju({
      year: sajuInput.year,
      month: sajuInput.month,
      day: sajuInput.day,
      hour: sajuInput.hour ?? 12,
      gender: sajuInput.gender ?? '남',
      calendarType: sajuInput.calendarType ?? '양력',
    })

    // 2) 케이스 매칭
    const matchInput: MatchingInput = {
      sajuResult,
      purpose,
      spaceType: spaceType as SpaceType,
      stylePreference: stylePreference as StyleCode,
      mode: mode || 'both',
    }

    const recommendation = matchSajuToCases(matchInput)

    // 3) 실제 작품 DB에서 매칭
    const supabase = getSupabase()

    // 추천 케이스 코드들로 작품 조회
    const topCaseCodes = recommendation.primary.map(r => r.caseCode)
    const { data: artworks } = await supabase
      .from('artworks')
      .select('*')
      .in('case_code', topCaseCodes)
      .limit(limit)

    // 작품에 매칭 점수 부여
    const matchedArtworks = artworks
      ? matchArtworks(artworks, matchInput)
      : []

    // 4) Top Base Cases (스타일 무관 빠른 추천)
    const topBaseCases = getTopBaseCases(sajuResult, purpose, 5)

    return Response.json({
      success: true,
      sajuProfile: recommendation.sajuProfile,
      recommendations: {
        primary: recommendation.primary.slice(0, 5),
        complement: recommendation.complement.slice(0, 5),
        enhance: recommendation.enhance.slice(0, 5),
      },
      topBaseCases,
      matchedArtworks: matchedArtworks.slice(0, limit),
      yongsin: {
        dayOhaeng: sajuResult.yongsin.dayOhaeng,
        dayStrength: sajuResult.yongsin.dayStrength,
        yongsin: sajuResult.yongsin.yongsin,
        huisin: sajuResult.yongsin.huisin,
        ohaengBalance: sajuResult.yongsin.ohaengBalance,
      },
    }, { headers: CORS })
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 500, headers: CORS })
  }
}
