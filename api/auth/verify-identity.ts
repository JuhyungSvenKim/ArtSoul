import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase } from '../_lib/supabase'
import { PASS_CONFIG } from '../_lib/auth'
import { setCors } from '../_lib/cors'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { action, userId, encData, realName, ci } = req.body

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId 필수' })
    }

    const supabase = getSupabase()

    if (action === 'request') {
      if (!PASS_CONFIG.siteCode) {
        // 테스트 모드
        await supabase.from('user_profiles').update({
          is_verified: true,
          real_name: '테스트유저',
          verified_at: new Date().toISOString(),
          verification_ci: `test_ci_${Date.now()}`,
        }).eq('user_id', userId)

        return res.status(200).json({
          success: true,
          mode: 'test',
          message: 'PASS 미설정 — 테스트 모드로 자동 인증 완료',
          verified: true,
        })
      }

      return res.status(200).json({
        success: true,
        mode: 'production',
        verificationUrl: 'https://nice.checkplus.co.kr/CheckPlusSa498',
        moduleData: {
          siteCode: PASS_CONFIG.siteCode,
          callbackUrl: PASS_CONFIG.callbackUrl,
          moduleType: PASS_CONFIG.moduleType,
        },
        message: 'NICE 본인인증 모듈을 실행해주세요',
      })
    }

    if (action === 'confirm') {
      const name = realName || '인증완료'
      const ciValue = ci || encData || `ci_${Date.now()}`

      const { data: existing } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('verification_ci', ciValue)
        .neq('user_id', userId)
        .limit(1)

      if (existing && existing.length > 0) {
        return res.status(409).json({
          success: false,
          error: '이미 다른 계정으로 인증된 정보입니다',
          duplicate: true,
        })
      }

      const { error } = await supabase.from('user_profiles').update({
        real_name: name,
        is_verified: true,
        verified_at: new Date().toISOString(),
        verification_ci: ciValue,
      }).eq('user_id', userId)

      if (error) throw error

      return res.status(200).json({
        success: true,
        verified: true,
        message: '본인인증이 완료되었습니다',
      })
    }

    return res.status(400).json({ success: false, error: 'action은 request 또는 confirm' })
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message })
  }
}
