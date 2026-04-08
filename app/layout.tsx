import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ART.D.N.A. — DNA × ART, 운명이 고른 그림',
  description: '사주 기반 AI 미술 추천 엔진. 당신의 사주 DNA에 맞는 예술작품을 찾아드립니다.',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] antialiased">
        {children}
      </body>
    </html>
  )
}
