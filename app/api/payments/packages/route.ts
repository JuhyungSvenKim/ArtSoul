/**
 * GET /api/payments/packages — 코인 충전 패키지 목록
 */
import { NextResponse } from 'next/server'
import { DEFAULT_PACKAGES } from '@/lib/payments'
import { getSupabaseServer } from '@/lib/supabase'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET() {
  try {
    const supabase = getSupabaseServer()
    const { data } = await supabase
      .from('coin_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    return NextResponse.json({
      success: true,
      packages: data && data.length > 0 ? data : DEFAULT_PACKAGES,
    }, { headers: corsHeaders })
  } catch {
    return NextResponse.json({
      success: true,
      packages: DEFAULT_PACKAGES,
    }, { headers: corsHeaders })
  }
}
