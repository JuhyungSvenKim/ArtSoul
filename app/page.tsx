export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>ArtSoul API</h1>
      <p>사주 × AI 미술 추천 엔진</p>

      <h2>API Endpoints</h2>

      <h3>POST /api/saju/analyze</h3>
      <p>사주팔자 계산 (4주 + 십성 + 12운성 + 격국 + 신살 + 공망 + 합충형파해 + 대운)</p>
      <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px', overflow: 'auto' }}>
{JSON.stringify({
  year: 1990, month: 5, day: 15, hour: 14,
  gender: "남", calendarType: "양력"
}, null, 2)}
      </pre>

      <h3>POST /api/saju/interpret</h3>
      <p>Gemini AI 사주 해석</p>
      <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px', overflow: 'auto' }}>
{JSON.stringify({
  prompt: "[사주팔자 프롬프트]",
  mode: "full"
}, null, 2)}
      </pre>
    </main>
  )
}
