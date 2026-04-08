/**
 * GET /api/auth/me — 현재 로그인 유저 정보
 * Header: Authorization: Bearer <token>
 */
import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'
import { getSupabaseServer } from '@/lib/supabase'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401, headers: corsHeaders },
      )
    }

    const token = authHeader.slice(7)
    const supabase = getSupabaseServer()

    // 1) 어드민 토큰 체크
    const adminPayload = verifyAdminToken(token)
    if (adminPayload) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', `admin_${adminPayload.sub}`)
        .single()

      const { data: coins } = await supabase
        .from('user_coins')
        .select('coins')
        .eq('user_id', `admin_${adminPayload.sub}`)
        .single()

      return NextResponse.json({
        success: true,
        profile: { ...profile, coins: coins?.coins ?? 0 },
      }, { headers: corsHeaders })
    }

    // 2) Supabase Auth 토큰 체크 (소셜 로그인)
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다' },
        { status: 401, headers: corsHeaders },
      )
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const { data: coins } = await supabase
      .from('user_coins')
      .select('coins')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      profile: {
        ...(profile || {
          user_id: user.id,
          display_name: user.user_metadata?.name || user.email?.split('@')[0] || '',
          email: user.email,
          role: 'user',
          is_verified: false,
          provider: user.app_metadata?.provider || null,
        }),
        coins: coins?.coins ?? 0,
      },
    }, { headers: corsHeaders })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders },
    )
  }
}
