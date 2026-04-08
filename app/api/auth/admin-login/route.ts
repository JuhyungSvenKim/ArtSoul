/**
 * POST /api/auth/admin-login — 어드민/슈퍼어드민 로그인
 *
 * Body: { id: string, password: string }
 * Returns: { token, profile }
 */
import { NextResponse } from 'next/server'
import { SUPERADMIN, createAdminToken } from '@/lib/auth'
import { getSupabaseServer } from '@/lib/supabase'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(req: Request) {
  try {
    const { id, password } = await req.json()

    if (!id || !password) {
      return NextResponse.json(
        { success: false, error: 'id, password 필수' },
        { status: 400, headers: corsHeaders },
      )
    }

    // 슈퍼어드민 체크
    if (id === SUPERADMIN.id && password === SUPERADMIN.password) {
      const token = createAdminToken(SUPERADMIN.id, 'superadmin')

      // 프로필 upsert
      const supabase = getSupabaseServer()
      await supabase.from('user_profiles').upsert({
        user_id: `admin_${SUPERADMIN.id}`,
        display_name: 'SuperAdmin',
        email: SUPERADMIN.email,
        role: 'superadmin',
        provider: 'admin',
      }, { onConflict: 'user_id' })

      // 코인 upsert (어드민은 9999 코인)
      await supabase.from('user_coins').upsert({
        user_id: `admin_${SUPERADMIN.id}`,
        coins: 9999,
      }, { onConflict: 'user_id' })

      return NextResponse.json({
        success: true,
        token,
        profile: {
          user_id: `admin_${SUPERADMIN.id}`,
          display_name: 'SuperAdmin',
          email: SUPERADMIN.email,
          role: 'superadmin',
          is_verified: true,
        },
      }, { headers: corsHeaders })
    }

    // 일반 어드민 체크 (DB에서)
    const supabase = getSupabaseServer()
    const { data: adminProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', `admin_${id}`)
      .in('role', ['admin', 'superadmin'])
      .single()

    if (!adminProfile) {
      return NextResponse.json(
        { success: false, error: '아이디 또는 비밀번호가 잘못되었습니다' },
        { status: 401, headers: corsHeaders },
      )
    }

    const token = createAdminToken(id, adminProfile.role)

    return NextResponse.json({
      success: true,
      token,
      profile: adminProfile,
    }, { headers: corsHeaders })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders },
    )
  }
}
