/**
 * POST /api/auth/verify-identity — PASS 본인인증 요청/완료
 *
 * 플로우:
 * 1. POST { action: 'request', userId } → 인증 URL/모듈 정보 반환
 * 2. 클라이언트에서 NICE/KCB 인증창 오픈
 * 3. 인증 완료 콜백 → POST { action: 'confirm', userId, encData } → 결과 저장
 *
 * 주의: 실제 PASS 연동은 NICE 평가정보(https://www.niceid.co.kr) 계약 필요.
 *       아래는 인터페이스 구현으로, 실제 암호화/복호화 로직은 NICE SDK 연동 시 추가.
 */
import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import { PASS_CONFIG } from '@/lib/auth'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId 필수' },
        { status: 400, headers: corsHeaders },
      )
    }

    const supabase = getSupabaseServer()

    if (action === 'request') {
      // ── 인증 요청 ──
      // 실제 구현 시: NICE 모듈에서 암호화 데이터 생성
      // 여기서는 인증 URL 형태만 반환

      if (!PASS_CONFIG.siteCode) {
        // 테스트 모드: PASS 미설정 시 바로 인증 성공 처리 (개발용)
        await supabase.from('user_profiles').update({
          is_verified: true,
          real_name: '테스트유저',
          verified_at: new Date().toISOString(),
          verification_ci: `test_ci_${Date.now()}`,
        }).eq('user_id', userId)

        return NextResponse.json({
          success: true,
          mode: 'test',
          message: 'PASS 미설정 — 테스트 모드로 자동 인증 완료',
          verified: true,
        }, { headers: corsHeaders })
      }

      // 프로덕션: NICE 본인인증 요청 데이터 생성
      return NextResponse.json({
        success: true,
        mode: 'production',
        verificationUrl: `https://nice.checkplus.co.kr/CheckPlusSa498`,
        moduleData: {
          siteCode: PASS_CONFIG.siteCode,
          callbackUrl: PASS_CONFIG.callbackUrl,
          moduleType: PASS_CONFIG.moduleType,
        },
        message: 'NICE 본인인증 모듈을 실행해주세요',
      }, { headers: corsHeaders })
    }

    if (action === 'confirm') {
      // ── 인증 완료 처리 ──
      const { encData, realName, ci } = body

      // 실제 구현 시: NICE SDK로 encData 복호화 → 이름, CI, 생년월일 추출
      // 여기서는 전달받은 값 직접 저장

      const name = realName || '인증완료'
      const ciValue = ci || encData || `ci_${Date.now()}`

      // CI 중복 체크 (같은 사람이 여러 계정 만드는 것 방지)
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('verification_ci', ciValue)
        .neq('user_id', userId)
        .limit(1)

      if (existing && existing.length > 0) {
        return NextResponse.json({
          success: false,
          error: '이미 다른 계정으로 인증된 정보입니다',
          duplicate: true,
        }, { status: 409, headers: corsHeaders })
      }

      // 프로필 업데이트
      const { error } = await supabase.from('user_profiles').update({
        real_name: name,
        is_verified: true,
        verified_at: new Date().toISOString(),
        verification_ci: ciValue,
      }).eq('user_id', userId)

      if (error) throw error

      return NextResponse.json({
        success: true,
        verified: true,
        message: '본인인증이 완료되었습니다',
      }, { headers: corsHeaders })
    }

    return NextResponse.json(
      { success: false, error: 'action은 request 또는 confirm' },
      { status: 400, headers: corsHeaders },
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders },
    )
  }
}
