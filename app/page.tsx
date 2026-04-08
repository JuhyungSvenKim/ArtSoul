'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ELEMENT_MAP } from '@/lib/case-code/types'
import type { OhaengElement } from '@/lib/case-code/types'

const OHAENG_COLORS: Record<OhaengElement, [string, string]> = {
  W: ['#2d6e4a', '#6bc48e'],
  F: ['#a03030', '#f07070'],
  E: ['#8a6a1c', '#e4ba5c'],
  M: ['#505060', '#c0c0d0'],
  A: ['#2a4e80', '#6a9ed5'],
}

export default function Home() {
  const [form, setForm] = useState({
    year: '', month: '', day: '', hour: '12',
    gender: '남' as '남' | '여',
    calendarType: '양력' as '양력' | '음력',
  })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function handleAnalyze() {
    if (!form.year || !form.month || !form.day) return
    setLoading(true)
    try {
      const res = await fetch('/api/artworks/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sajuInput: {
            year: parseInt(form.year),
            month: parseInt(form.month),
            day: parseInt(form.day),
            hour: parseInt(form.hour),
            gender: form.gender,
            calendarType: form.calendarType,
          },
        }),
      })
      const data = await res.json()
      if (data.success) setResult(data)
    } catch {}
    setLoading(false)
  }

  return (
    <main className="min-h-screen">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#2a2a2a]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[#c8a45e] font-bold text-lg tracking-tight">ART.D.N.A.</span>
          </Link>
          <div className="flex gap-6 text-sm">
            <Link href="/explore" className="text-[#888] hover:text-[#c8a45e] transition-colors">탐색</Link>
            <Link href="/admin" className="text-[#888] hover:text-[#c8a45e] transition-colors">관리</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section — 운명과 그림의 만남 ── */}
      <section className="pt-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a] z-10" />

        {/* Symbolic DNA × Art background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <svg viewBox="0 0 600 400" className="w-full max-w-3xl">
            {/* DNA helix left strand */}
            <path d="M150 20 Q300 100 150 200 Q0 300 150 380" stroke="#c8a45e" strokeWidth="2" fill="none" opacity="0.6">
              <animate attributeName="d" dur="8s" repeatCount="indefinite"
                values="M150 20 Q300 100 150 200 Q0 300 150 380;M150 20 Q0 100 150 200 Q300 300 150 380;M150 20 Q300 100 150 200 Q0 300 150 380"/>
            </path>
            {/* DNA helix right strand */}
            <path d="M450 20 Q300 100 450 200 Q600 300 450 380" stroke="#c8a45e" strokeWidth="2" fill="none" opacity="0.6">
              <animate attributeName="d" dur="8s" repeatCount="indefinite"
                values="M450 20 Q300 100 450 200 Q600 300 450 380;M450 20 Q600 100 450 200 Q300 300 450 380;M450 20 Q300 100 450 200 Q600 300 450 380"/>
            </path>
            {/* Five element circles */}
            {(['W', 'F', 'E', 'M', 'A'] as OhaengElement[]).map((el, i) => (
              <circle
                key={el}
                cx={180 + i * 60}
                cy={200}
                r={20 + Math.sin(i) * 5}
                fill={ELEMENT_MAP[el].color}
                opacity={0.3}
              >
                <animate attributeName="cy" dur={`${3 + i * 0.5}s`} repeatCount="indefinite"
                  values={`${200};${180};${220};${200}`}/>
                <animate attributeName="opacity" dur={`${4 + i * 0.3}s`} repeatCount="indefinite"
                  values="0.3;0.6;0.3"/>
              </circle>
            ))}
            {/* Connection lines between circles */}
            {[0, 1, 2, 3].map(i => (
              <line key={i} x1={180 + i * 60} y1={200} x2={240 + i * 60} y2={200}
                stroke="#c8a45e" strokeWidth="0.5" opacity="0.3"/>
            ))}
          </svg>
        </div>

        <div className="relative z-20 max-w-2xl mx-auto px-4 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 text-[#c8a45e]/60 text-xs tracking-[0.3em] uppercase mb-6">
            <span className="w-8 h-px bg-[#c8a45e]/30" />
            DNA × ART
            <span className="w-8 h-px bg-[#c8a45e]/30" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            <span className="text-[#c8a45e]">운명</span>이 고른
            <br />당신만의 <span className="text-[#c8a45e]">그림</span>
          </h1>

          <p className="text-[#888] text-base md:text-lg mb-10 leading-relaxed">
            사주 DNA에 새겨진 오행의 흐름이<br />
            당신에게 꼭 맞는 예술작품을 찾아냅니다
          </p>

          {/* ── 사주 입력 폼 ── */}
          <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-6 text-left max-w-md mx-auto">
            <h2 className="text-sm font-semibold text-[#c8a45e] mb-4 tracking-wider">나의 ART DNA 찾기</h2>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <input
                type="number" placeholder="년도" value={form.year}
                onChange={e => setForm({ ...form, year: e.target.value })}
                className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] placeholder-[#555] focus:border-[#c8a45e]/50 focus:outline-none transition"
              />
              <input
                type="number" placeholder="월" min="1" max="12" value={form.month}
                onChange={e => setForm({ ...form, month: e.target.value })}
                className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] placeholder-[#555] focus:border-[#c8a45e]/50 focus:outline-none transition"
              />
              <input
                type="number" placeholder="일" min="1" max="31" value={form.day}
                onChange={e => setForm({ ...form, day: e.target.value })}
                className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] placeholder-[#555] focus:border-[#c8a45e]/50 focus:outline-none transition"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <select
                value={form.hour}
                onChange={e => setForm({ ...form, hour: e.target.value })}
                className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] focus:border-[#c8a45e]/50 focus:outline-none transition"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i}시</option>
                ))}
              </select>
              <select
                value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value as '남' | '여' })}
                className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] focus:border-[#c8a45e]/50 focus:outline-none transition"
              >
                <option value="남">남성</option>
                <option value="여">여성</option>
              </select>
              <select
                value={form.calendarType}
                onChange={e => setForm({ ...form, calendarType: e.target.value as '양력' | '음력' })}
                className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] focus:border-[#c8a45e]/50 focus:outline-none transition"
              >
                <option value="양력">양력</option>
                <option value="음력">음력</option>
              </select>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !form.year || !form.month || !form.day}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#c8a45e] to-[#a68a3e] text-black font-bold text-sm
                hover:from-[#dbb978] hover:to-[#c8a45e] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  사주 분석 중...
                </span>
              ) : 'ART DNA 분석하기'}
            </button>
          </div>
        </div>
      </section>

      {/* ── 결과 섹션 ── */}
      {result && (
        <section className="max-w-4xl mx-auto px-4 pb-20">
          {/* 사주 프로파일 */}
          <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-6 mb-6">
            <h2 className="text-lg font-bold text-[#c8a45e] mb-4">당신의 ART DNA</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <InfoCard label="일간 오행" value={result.yongsin.dayOhaeng} />
              <InfoCard label="일간 강약" value={result.yongsin.dayStrength} />
              <InfoCard label="용신" value={result.yongsin.yongsin} highlight />
              <InfoCard label="희신" value={result.yongsin.huisin} />
            </div>

            {/* 오행 분포 바 */}
            <div className="space-y-2">
              <p className="text-xs text-[#888] mb-2">오행 분포</p>
              {(['목', '화', '토', '금', '수'] as const).map(oh => {
                const count = result.yongsin.ohaengBalance[oh] || 0
                const el = { '목': 'W', '화': 'F', '토': 'E', '금': 'M', '수': 'A' }[oh] as OhaengElement
                const color = ELEMENT_MAP[el].color
                return (
                  <div key={oh} className="flex items-center gap-3">
                    <span className="text-xs w-6" style={{ color }}>{oh}</span>
                    <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${(count / 8) * 100}%`, background: color }}
                      />
                    </div>
                    <span className="text-xs text-[#888] w-4 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 추천 케이스 코드 */}
          <h3 className="text-base font-bold text-[#e5e5e5] mb-4">
            추천 <span className="text-[#c8a45e]">ART CASE</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {result.recommendations.primary?.map((rec: any, i: number) => {
              const el = rec.element as OhaengElement
              const elInfo = ELEMENT_MAP[el]
              return (
                <div key={i} className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4 hover:border-[#c8a45e]/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-sm font-bold px-2 py-0.5 rounded-md"
                      style={{ background: `${elInfo.color}20`, color: elInfo.color }}
                    >
                      {rec.caseCode}
                    </span>
                    <span className="text-xs text-[#c8a45e] font-bold">{rec.totalScore}점</span>
                  </div>

                  <div className="flex gap-2 mb-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      rec.recommendationType === '보완형'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-green-500/10 text-green-400'
                    }`}>
                      {rec.recommendationType}
                    </span>
                  </div>

                  <p className="text-xs text-[#888] leading-relaxed">{rec.reason}</p>

                  {/* Score breakdown */}
                  <div className="mt-3 grid grid-cols-4 gap-1">
                    {[
                      { label: '오행', score: rec.breakdown.elementScore, color: '#c8a45e' },
                      { label: '에너지', score: rec.breakdown.energyScore, color: '#6a9ed5' },
                      { label: '스타일', score: rec.breakdown.styleScore, color: '#4a9e6e' },
                      { label: '공간', score: rec.breakdown.spaceScore, color: '#888' },
                    ].map(b => (
                      <div key={b.label} className="text-center">
                        <div className="text-[9px] text-[#666] mb-0.5">{b.label}</div>
                        <div className="text-[10px] font-bold" style={{ color: b.color }}>{b.score}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Top Base Cases */}
          {result.topBaseCases && (
            <div className="mb-8">
              <h3 className="text-base font-bold text-[#e5e5e5] mb-4">
                핵심 <span className="text-[#c8a45e]">Base Case</span>
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {result.topBaseCases.map((bc: any, i: number) => {
                  const el = bc.element as OhaengElement
                  const [c1, c2] = OHAENG_COLORS[el]
                  return (
                    <div
                      key={i}
                      className="flex-shrink-0 w-32 h-40 rounded-xl flex flex-col items-center justify-center relative overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                    >
                      <span className="text-2xl font-black text-white/90">{bc.baseCode}</span>
                      <span className="text-[10px] text-white/60 mt-1">{bc.reason}</span>
                      <span className="absolute bottom-2 text-[10px] text-white/40 font-bold">{bc.score}점</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/explore"
              className="inline-block px-8 py-3 rounded-xl bg-[#141414] border border-[#c8a45e]/30 text-[#c8a45e] font-semibold text-sm hover:bg-[#c8a45e]/10 transition-all"
            >
              작품 탐색하러 가기 →
            </Link>
          </div>
        </section>
      )}

      {/* ── 하단 오행 인트로 ── */}
      {!result && (
        <section className="max-w-4xl mx-auto px-4 pb-20">
          <div className="text-center mb-10">
            <h2 className="text-lg font-bold text-[#e5e5e5] mb-2">오행, 그 안에 숨겨진 예술의 언어</h2>
            <p className="text-sm text-[#888]">다섯 가지 기운이 당신의 미감을 결정합니다</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {(['W', 'F', 'E', 'M', 'A'] as OhaengElement[]).map(el => {
              const info = ELEMENT_MAP[el]
              const [c1, c2] = OHAENG_COLORS[el]
              return (
                <div
                  key={el}
                  className="rounded-xl p-4 text-center aspect-square flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer"
                  style={{ background: `linear-gradient(135deg, ${c1}40, ${c2}40)`, border: `1px solid ${info.color}30` }}
                >
                  <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    {{ W: '🌿', F: '🔥', E: '🏔️', M: '⚔️', A: '💧' }[el]}
                  </span>
                  <span className="text-sm font-bold" style={{ color: info.color }}>{info.labelKor}</span>
                  <span className="text-[10px] text-[#888] mt-0.5">{info.label}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-[#2a2a2a] py-6 text-center text-xs text-[#555]">
        ART.D.N.A. — 운명이 고른 그림 · DNA × ART
      </footer>
    </main>
  )
}

function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-[#0a0a0a] rounded-lg p-3 text-center">
      <div className="text-[10px] text-[#888] mb-1">{label}</div>
      <div className={`text-lg font-bold ${highlight ? 'text-[#c8a45e]' : 'text-[#e5e5e5]'}`}>{value}</div>
    </div>
  )
}
