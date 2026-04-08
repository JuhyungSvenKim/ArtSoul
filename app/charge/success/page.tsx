'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    confirmPayment()
  }, [])

  async function confirmPayment() {
    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')
    const amount = searchParams.get('amount')

    if (!paymentKey || !orderId || !amount) {
      setError('결제 정보가 올바르지 않습니다')
      setLoading(false)
      return
    }

    const profile = localStorage.getItem('artsoul_profile')
    const userId = profile ? JSON.parse(profile).user_id : null

    if (!userId) {
      setError('로그인 정보를 찾을 수 없습니다')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: parseInt(amount),
          userId,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setResult(data)
        if (profile) {
          const p = JSON.parse(profile)
          p.coins = data.coins
          localStorage.setItem('artsoul_profile', JSON.stringify(p))
        }
      } else {
        setError(data.error)
      }
    } catch {
      setError('결제 확인 중 오류가 발생했습니다')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <>
        <div className="shimmer w-16 h-16 rounded-full mx-auto mb-4" />
        <p className="text-[#888] text-sm">결제 확인 중...</p>
      </>
    )
  }

  if (result) {
    return (
      <>
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[#e5e5e5] mb-2">충전 완료!</h1>
        <p className="text-3xl font-black text-[#c8a45e] mb-1">+{result.charged}코인</p>
        <p className="text-sm text-[#888] mb-6">보유 코인: {result.coins}</p>
        <Link
          href="/"
          className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-[#c8a45e] to-[#a68a3e] text-black font-bold text-sm"
        >
          ART DNA 분석하러 가기
        </Link>
      </>
    )
  }

  return (
    <>
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-[#e5e5e5] mb-2">결제 실패</h1>
      <p className="text-sm text-red-400/70 mb-6">{error}</p>
      <Link href="/charge" className="text-sm text-[#c8a45e] underline">다시 시도</Link>
    </>
  )
}

export default function ChargeSuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <Suspense fallback={
          <>
            <div className="shimmer w-16 h-16 rounded-full mx-auto mb-4" />
            <p className="text-[#888] text-sm">로딩 중...</p>
          </>
        }>
          <SuccessContent />
        </Suspense>
      </div>
    </main>
  )
}
