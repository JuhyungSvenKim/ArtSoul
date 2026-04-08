'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { UserProfile } from '@/lib/auth'

export default function MyPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const token = localStorage.getItem('artsoul_token')
    if (!token) {
      window.location.href = '/login'
      return
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setProfile(data.profile)
      } else {
        localStorage.removeItem('artsoul_token')
        window.location.href = '/login'
      }
    } catch {
      window.location.href = '/login'
    }
    setLoading(false)
  }

  async function handleVerify() {
    if (!profile) return
    setVerifying(true)

    try {
      const res = await fetch('/api/auth/verify-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request',
          userId: profile.user_id,
        }),
      })
      const data = await res.json()

      if (data.mode === 'test' && data.verified) {
        // 테스트 모드: 바로 인증 완료
        setProfile(prev => prev ? { ...prev, is_verified: true, real_name: '테스트유저' } : null)
        alert('본인인증 완료! (테스트 모드)')
      } else if (data.verificationUrl) {
        // 프로덕션: NICE 인증창 오픈
        window.open(data.verificationUrl, 'pass_verify', 'width=500,height=700')
      }
    } catch {
      alert('인증 요청 중 오류가 발생했습니다')
    }
    setVerifying(false)
  }

  function handleLogout() {
    localStorage.removeItem('artsoul_token')
    localStorage.removeItem('artsoul_profile')
    window.location.href = '/'
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="shimmer w-10 h-10 rounded-full" />
      </main>
    )
  }

  if (!profile) return null

  const providerLabel: Record<string, string> = {
    kakao: '카카오',
    apple: 'Apple',
    naver: '네이버',
    admin: '관리자',
  }

  return (
    <main className="min-h-screen">
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#2a2a2a]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-[#c8a45e] font-bold text-lg tracking-tight">ART.D.N.A.</Link>
          <div className="flex gap-6 text-sm">
            <Link href="/" className="text-[#888] hover:text-[#c8a45e] transition-colors">홈</Link>
            <Link href="/explore" className="text-[#888] hover:text-[#c8a45e] transition-colors">탐색</Link>
            <span className="text-[#c8a45e]">마이페이지</span>
          </div>
        </div>
      </nav>

      <div className="pt-20 pb-16 max-w-lg mx-auto px-4">
        {/* 프로필 카드 */}
        <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#c8a45e] to-[#a68a3e] flex items-center justify-center text-black text-xl font-bold">
                {(profile.display_name || '?')[0]}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-[#e5e5e5]">{profile.display_name || '이름 없음'}</h1>
              <div className="flex items-center gap-2 mt-1">
                {profile.provider && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2a2a2a] text-[#888]">
                    {providerLabel[profile.provider] || profile.provider}
                  </span>
                )}
                {profile.role !== 'user' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c8a45e]/10 text-[#c8a45e]">
                    {profile.role === 'superadmin' ? '슈퍼관리자' : '관리자'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 정보 항목 */}
          <div className="space-y-3">
            <InfoRow label="이메일" value={profile.email || '미설정'} />
            <InfoRow label="전화번호" value={profile.phone || '미설정'} />

            {/* 본인인증 */}
            <div className="flex items-center justify-between py-2 border-b border-[#2a2a2a]">
              <span className="text-xs text-[#888]">본인인증</span>
              {profile.is_verified ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-green-400">{profile.real_name || '인증완료'}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400">인증됨</span>
                </div>
              ) : (
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="text-xs px-3 py-1 rounded-lg bg-[#c8a45e]/10 text-[#c8a45e] hover:bg-[#c8a45e]/20 transition-all disabled:opacity-40"
                >
                  {verifying ? '인증 중...' : 'PASS 본인인증'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 코인 */}
        <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#c8a45e]">보유 코인</h2>
            <span className="text-2xl font-bold text-[#c8a45e]">{profile.coins ?? 0}</span>
          </div>
          <Link
            href="/charge"
            className="block w-full py-2.5 rounded-xl bg-gradient-to-r from-[#c8a45e] to-[#a68a3e] text-black font-bold text-sm text-center hover:from-[#dbb978] hover:to-[#c8a45e] transition-all"
          >
            코인 충전하기
          </Link>
        </div>

        {/* 액션 */}
        <div className="space-y-2">
          {(profile.role === 'admin' || profile.role === 'superadmin') && (
            <Link href="/admin" className="block w-full py-3 rounded-xl bg-[#141414] border border-[#2a2a2a] text-center text-sm text-[#e5e5e5] hover:border-[#c8a45e]/30 transition-all">
              관리자 페이지
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl bg-[#141414] border border-[#2a2a2a] text-center text-sm text-red-400/70 hover:text-red-400 hover:border-red-500/30 transition-all"
          >
            로그아웃
          </button>
        </div>
      </div>
    </main>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#2a2a2a]">
      <span className="text-xs text-[#888]">{label}</span>
      <span className="text-xs text-[#e5e5e5]">{value}</span>
    </div>
  )
}
