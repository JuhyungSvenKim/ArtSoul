/**
 * GET    /api/artworks/:id  — 작품 상세
 * PUT    /api/artworks/:id  — 작품 수정
 * DELETE /api/artworks/:id  — 작품 삭제
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
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = getSupabase()
    const { data, error } = await supabase.from('artworks').select('*').eq('id', id).single()
    if (error) throw error
    return Response.json({ success: true, artwork: data }, { headers: CORS })
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 500, headers: CORS })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, artist, description, element, energy, style, image_url, tags, space_type, price_range } = body

    const updates: Record<string, any> = {}
    if (title !== undefined) updates.title = title
    if (artist !== undefined) updates.artist = artist
    if (description !== undefined) updates.description = description
    if (image_url !== undefined) updates.image_url = image_url
    if (tags !== undefined) updates.tags = tags
    if (space_type !== undefined) updates.space_type = space_type
    if (price_range !== undefined) updates.price_range = price_range

    if (element !== undefined) updates.element = element
    if (energy !== undefined) updates.energy = energy
    if (style !== undefined) updates.style = style

    if (updates.element || updates.energy || updates.style) {
      const supabase = getSupabase()
      const { data: current } = await supabase.from('artworks').select('element, energy, style').eq('id', id).single()
      const el = (updates.element || current?.element) as OhaengElement
      const en = (updates.energy || current?.energy) as EnergyLevel
      const st = (updates.style || current?.style) as StyleCode
      updates.case_code = buildCaseCode(el, en, st)
    }

    const supabase = getSupabase()
    const { data, error } = await supabase.from('artworks').update(updates).eq('id', id).select().single()
    if (error) throw error

    return Response.json({ success: true, artwork: data }, { headers: CORS })
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 500, headers: CORS })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = getSupabase()
    const { error } = await supabase.from('artworks').delete().eq('id', id)
    if (error) throw error
    return Response.json({ success: true }, { headers: CORS })
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 500, headers: CORS })
  }
}
