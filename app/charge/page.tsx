'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DEFAULT_PACKAGES, TOSS_CONFIG, formatPrice } from '@/lib/payments'
import type { CoinPackage } from '@/lib/payments'

export default function ChargePage() {
  const [packages, setPackages] = useState<CoinPackage[]>(DEFAULT_PACKAGES)
  const [selected, setSelected] = useState<CoinPackage | null>(null)
  const [loading, setLoading] = useState(false)
  const [userCoins, setUserCoins] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // 프로필에서 userId 가져오기
    const profile = localStorage.getItem('artsoul_profile')
    if (profile) {
      const p = JSON.parse(profile)
      setUserId(p.user_id)
      setUserCoins(p.coins || 0)
    }

    // DB에서 패키지 조회 시도
    fetch('/api/payments/packages')
      .then(r => r.json())
      .then(d => { if (d.success && d.packages) setPackages(d.packages) })
      .catch(() => {})
  }, [])

  async function handlePurchase() {
    if (!selected || !userId) return
    setLoading(true)

    try {
      // 1) 주문 생성
      const prepRes = await fetch('/api/payments/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, packageId: selected.id }),
      })
      const prepData = await prepRes.json()

      if (!prepData.success) {
        alert(prepData.error)
        setLoading(false)
        return
      }

      // 2) 토스페이먼츠 SDK 로드 (스크립트 태그 방식)
      // SDK가 아직 로드되지 않았으면 스크립트 삽입
      if (!(window as any).TossPayments) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://js.tosspayments.com/v2/standard'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('토스페이먼츠 SDK 로드 실패'))
          document.head.appendChild(script)
        })
      }

      const tossPayments = (window as any).TossPayments(TOSS_CONFIG.clientKey)
      const payment = tossPayments.payment({ customerKey: userId })

      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: prepData.amount },
        orderId: prepData.orderId,
        orderName: prepData.orderName,
        successUrl: `${window.location.origin}/charge/success`,
        failUrl: `${window.location.origin}/charge/fail`,
      })
    } catch (err: any) {
      if (err.code === 'USER_CANCEL') {
        // 사용자가 취소
      } else {
        alert(err.message || '결제 중 오류가 발생했습니다')
      }
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen">
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#2a2a2a]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-[#c8a45e] font-bold text-lg tracking-tight">ART.D.N.A.</Link>
          <div className="flex gap-6 text-sm">
            <Link href="/mypage" className="text-[#888] hover:text-[#c8a45e] transition-colors">마이</Link>
          </div>
        </div>
      </nav>

      <div className="pt-20 pb-16 max-w-lg mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#e5e5e5] mb-2">코인 충전</h1>
        <p className="text-sm text-[#888] mb-1">보유 코인: <span className="text-[#c8a45e] font-bold">{userCoins}</span></p>
        <p className="text-xs text-[#666] mb-6">사주해석 2코인, 일/주/월운세 1코인, 년운세 3코인</p>

        {/* 패키지 선택 */}
        <div className="space-y-3 mb-8">
          {packages.filter(p => p.is_active).map(pkg => {
            const isSelected = selected?.id === pkg.id
            const perCoin = Math.round(pkg.price / (pkg.coins + pkg.bonus_coins))

            return (
              <button
                key={pkg.id}
                onClick={() => setSelected(pkg)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-[#c8a45e] bg-[#c8a45e]/5'
                    : 'border-[#2a2a2a] bg-[#141414] hover:border-[#333]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-bold ${isSelected ? 'text-[#c8a45e]' : 'text-[#e5e5e5]'}`}>
                        {pkg.name}
                      </span>
                      {pkg.bonus_coins > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#c8a45e]/10 text-[#c8a45e]">
                          +{pkg.bonus_coins} 보너스
                        </span>
                      )}
                      {pkg.id === 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                          인기
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#888] mt-0.5">
                      {pkg.coins}코인{pkg.bonus_coins > 0 ? ` + ${pkg.bonus_coins}보너스` : ''} · 코인당 {perCoin}원
                    </p>
                  </div>
                  <span className={`text-lg font-bold ${isSelected ? 'text-[#c8a45e]' : 'text-[#e5e5e5]'}`}>
                    {formatPrice(pkg.price)}원
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* 결제 버튼 */}
        <button
          onClick={handlePurchase}
          disabled={!selected || loading || !userId}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#c8a45e] to-[#a68a3e] text-black font-bold text-sm
            hover:from-[#dbb978] hover:to-[#c8a45e] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {loading ? '결제 처리 중...' : selected ? `${formatPrice(selected.price)}원 결제하기` : '패키지를 선택하세요'}
        </button>

        {!userId && (
          <p className="text-center text-xs text-red-400/70 mt-3">
            <Link href="/login" className="underline">로그인</Link> 후 충전할 수 있습니다
          </p>
        )}

        {/* 안내 */}
        <div className="mt-8 space-y-2 text-[10px] text-[#555]">
          <p>· 결제 후 즉시 코인이 충전됩니다</p>
          <p>· 충전된 코인은 환불이 불가합니다</p>
          <p>· 보너스 코인은 유효기간 없이 영구 사용 가능합니다</p>
          <p>· 결제 문의: support@artsoul.art</p>
        </div>
      </div>
    </main>
  )
}
