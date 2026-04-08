/**
 * GET  /api/artworks         — 작품 목록 (필터링 지원)
 * POST /api/artworks         — 작품 등록 (어드민)
 */
import { createClient } from '@supabase/supabase-js'
import { buildCaseCode } from '@/lib/case-code'
import type { OhaengElement, EnergyLevel, StyleCode } from '@/lib/case-code'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase not configured')
  return createClient(url, key)
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const element = url.searchParams.get('element')
    const energy = url.searchParams.get('energy')
    const style = url.searchParams.get('style')
    const caseCode = url.searchParams.get('case_code')
    const spaceType = url.searchParams.get('space_type')
    const search = url.searchParams.get('search')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const supabase = getSupabase()
    let query = supabase.from('artworks').select('*', { count: 'exact' })

    if (caseCode) query = query.eq('case_code', caseCode)
    if (element) query = query.eq('element', element)
    if (energy) query = query.eq('energy', parseInt(energy))
    if (style) query = query.eq('style', style)
    if (spaceType) query = query.eq('space_type', spaceType)
    if (search) query = query.or(`title.ilike.%${search}%,artist.ilike.%${search}%,description.ilike.%${search}%`)

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return Response.json({ success: true, artworks: data, total: count }, { headers: CORS })
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 500, headers: CORS })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, artist, description, element, energy, style, image_url, tags, space_type, price_range } = body

    if (!title || !element || !energy || !style) {
      return Response.json({ success: false, error: 'title, element, energy, style 필수' }, { status: 400, headers: CORS })
    }

    const validElements = ['W', 'F', 'E', 'M', 'A']
    const validEnergies = [1, 2, 3, 4, 5]
    const validStyles = ['S1', 'S2', 'S3', 'S4', 'S5']

    if (!validElements.includes(element)) {
      return Response.json({ success: false, error: `element는 ${validElements.join(',')} 중 하나` }, { status: 400, headers: CORS })
    }
    if (!validEnergies.includes(energy)) {
      return Response.json({ success: false, error: 'energy는 1~5' }, { status: 400, headers: CORS })
    }
    if (!validStyles.includes(style)) {
      return Response.json({ success: false, error: `style은 ${validStyles.join(',')} 중 하나` }, { status: 400, headers: CORS })
    }

    const case_code = buildCaseCode(element as OhaengElement, energy as EnergyLevel, style as StyleCode)

    const supabase = getSupabase()
    const { data, error } = await supabase.from('artworks').insert({
      title,
      artist: artist || '',
      description: description || '',
      case_code,
      element,
      energy,
      style,
      image_url: image_url || null,
      tags: tags || [],
      space_type: space_type || null,
      price_range: price_range || null,
    }).select().single()

    if (error) throw error

    return Response.json({ success: true, artwork: data }, { status: 201, headers: CORS })
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 500, headers: CORS })
  }
}
