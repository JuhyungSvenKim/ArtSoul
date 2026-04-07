export const metadata = {
  title: 'ArtSoul - 사주 × AI 미술 추천',
  description: '만세력 기반 사주팔자 계산 + AI 해석 API',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
