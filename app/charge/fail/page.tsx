'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function FailContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const message = searchParams.get('message')

  return (
    <>
      <h1 className="text-xl font-bold text-[#e5e5e5] mb-2">결제 실패</h1>
      <p className="text-sm text-[#888] mb-1">{message || '결제가 취소되었거나 실패했습니다'}</p>
      {code && <p className="text-[10px] text-[#555] mb-6">오류 코드: {code}</p>}
    </>
  )
}

export default function ChargeFailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <Suspense fallback={<p className="text-[#888]">로딩 중...</p>}>
          <FailContent />
        </Suspense>
        <div className="flex gap-3 justify-center">
          <Link href="/charge" className="px-6 py-2.5 rounded-xl bg-[#c8a45e] text-black font-bold text-sm">
            다시 시도
          </Link>
          <Link href="/" className="px-6 py-2.5 rounded-xl bg-[#141414] border border-[#2a2a2a] text-sm text-[#888]">
            홈으로
          </Link>
        </div>
      </div>
    </main>
  )
}
