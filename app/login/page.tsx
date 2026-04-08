'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SUPABASE_URL } from '@/lib/supabase'

export default function LoginPage() {
  const [mode, setMode] = useState<'social' | 'admin'>('social')
  const [adminId, setAdminId] = useState('')
  const [adminPw, setAdminPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // ── 소셜 로그인 ──
  async function handleSocialLogin(provider: 'kakao' | 'apple' | 'naver') {
    setError('')

    if (provider === 'naver') {
      // 네이버: 수동 OAuth
      const state = Math.random().toString(36).substring(2)
      const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID
      if (!clientId) {
        setError('네이버 로그인 설정이 필요합니다 (NEXT_PUBLIC_NAVER_CLIENT_ID)')
        return
      }
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: `${window.location.origin}/api/auth/naver/callback`,
        state,
      })
      window.location.href = `https://nid.naver.com/oauth2.0/authorize?${params}`
      return
    }

    // 카카오, 애플: Supabase Auth
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    )

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
    }
  }

  // ── 어드민 로그인 ──
  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: adminId, password: adminPw }),
      })
      const data = await res.json()

      if (data.success) {
        localStorage.setItem('artsoul_token', data.token)
        localStorage.setItem('artsoul_profile', JSON.stringify(data.profile))
        window.location.href = '/admin'
      } else {
        setError(data.error)
      }
    } catch {
      setError('서버 오류가 발생했습니다')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-10">
          <Link href="/" className="text-[#c8a45e] font-bold text-2xl tracking-tight">ART.D.N.A.</Link>
          <p className="text-[#888] text-sm mt-1">운명이 고른 그림</p>
        </div>

        {/* 모드 토글 */}
        <div className="flex bg-[#141414] rounded-xl p-1 mb-6 border border-[#2a2a2a]">
          <button
            onClick={() => setMode('social')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'social' ? 'bg-[#c8a45e] text-black' : 'text-[#888]'
            }`}
          >
            회원가입 / 로그인
          </button>
          <button
            onClick={() => setMode('admin')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'admin' ? 'bg-[#c8a45e] text-black' : 'text-[#888]'
            }`}
          >
            관리자
          </button>
        </div>

        {/* ── 소셜 로그인 ── */}
        {mode === 'social' && (
          <div className="space-y-3">
            {/* 카카오 */}
            <button
              onClick={() => handleSocialLogin('kakao')}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: '#FEE500', color: '#191919' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 1C4.58 1 1 3.79 1 7.21c0 2.15 1.41 4.04 3.54 5.15l-.9 3.35c-.08.29.25.52.5.35l3.97-2.62c.29.03.58.05.89.05 4.42 0 8-2.79 8-6.22S13.42 1 9 1z" fill="#191919"/></svg>
              카카오로 시작하기
            </button>

            {/* 네이버 */}
            <button
              onClick={() => handleSocialLogin('naver')}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: '#03C75A', color: '#fff' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M12.1 9.47L5.71 0H0v18h5.9V8.53L12.29 18H18V0h-5.9v9.47z" fill="#fff"/></svg>
              네이버로 시작하기
            </button>

            {/* 애플 */}
            <button
              onClick={() => handleSocialLogin('apple')}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all bg-white text-black"
            >
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M14.94 14.42c-.34.8-.75 1.53-1.23 2.2-.65.92-1.18 1.55-1.6 1.9-.63.57-1.31.86-2.03.88-.52 0-1.14-.15-1.87-.44-.73-.3-1.4-.44-2.01-.44-.65 0-1.34.15-2.09.44-.75.3-1.35.45-1.82.47-.69.04-1.39-.26-2.09-.9-.45-.38-1.01-1.04-1.69-1.97C-2.21 15.37-2.77 14.03-2.77 12.64c0-1.24.27-2.3.8-3.2.43-.72 1-1.29 1.71-1.7.72-.42 1.49-.63 2.33-.65.55 0 1.27.17 2.18.5.89.33 1.47.5 1.72.5.19 0 .82-.2 1.9-.59.63-.23 1.33-.41 2.1-.55-1.72-.42-3.01.09-3.88 1.53.82.57 1.47 1.34 1.93 2.31.46.96.69 2.01.69 3.14z" fill="#000" transform="translate(3,0)"/></svg>
              Apple로 시작하기
            </button>

            <div className="text-center pt-4">
              <p className="text-[10px] text-[#555] leading-relaxed">
                로그인 시 <span className="text-[#888]">이용약관</span> 및 <span className="text-[#888]">개인정보처리방침</span>에 동의합니다
              </p>
            </div>
          </div>
        )}

        {/* ── 어드민 로그인 ── */}
        {mode === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs text-[#888] mb-1 block">아이디</label>
              <input
                type="text" required value={adminId}
                onChange={e => setAdminId(e.target.value)}
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] focus:border-[#c8a45e]/50 focus:outline-none"
                placeholder="관리자 아이디"
              />
            </div>
            <div>
              <label className="text-xs text-[#888] mb-1 block">비밀번호</label>
              <input
                type="password" required value={adminPw}
                onChange={e => setAdminPw(e.target.value)}
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] focus:border-[#c8a45e]/50 focus:outline-none"
                placeholder="비밀번호"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#c8a45e] to-[#a68a3e] text-black font-bold text-sm hover:from-[#dbb978] hover:to-[#c8a45e] disabled:opacity-40 transition-all"
            >
              {loading ? '로그인 중...' : '관리자 로그인'}
            </button>
          </form>
        )}

        {/* 에러 */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}
      </div>
    </main>
  )
}
