'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ELEMENT_MAP, ENERGY_MAP, STYLE_MAP } from '@/lib/case-code/types'
import type { OhaengElement, EnergyLevel, StyleCode } from '@/lib/case-code/types'
import { ArtworkCard } from '@/components/ArtworkImage'
import { ElementFilter } from '@/components/CaseCodeBadge'

export default function ExplorePage() {
  const [artworks, setArtworks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // 필터 상태
  const [element, setElement] = useState<OhaengElement | null>(null)
  const [energy, setEnergy] = useState<EnergyLevel | null>(null)
  const [style, setStyle] = useState<StyleCode | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const limit = 24

  const fetchArtworks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (element) params.set('element', element)
      if (energy) params.set('energy', String(energy))
      if (style) params.set('style', style)
      if (search) params.set('search', search)
      params.set('limit', String(limit))
      params.set('offset', String(page * limit))

      const res = await fetch(`/api/artworks?${params}`)
      const data = await res.json()
      if (data.success) {
        setArtworks(data.artworks || [])
        setTotal(data.total || 0)
      }
    } catch {}
    setLoading(false)
  }, [element, energy, style, search, page])

  useEffect(() => { fetchArtworks() }, [fetchArtworks])
  useEffect(() => { setPage(0) }, [element, energy, style, search])

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#2a2a2a]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-[#c8a45e] font-bold text-lg tracking-tight">ART.D.N.A.</Link>
          <div className="flex gap-6 text-sm">
            <Link href="/" className="text-[#888] hover:text-[#c8a45e] transition-colors">홈</Link>
            <span className="text-[#c8a45e]">탐색</span>
            <Link href="/admin" className="text-[#888] hover:text-[#c8a45e] transition-colors">관리</Link>
          </div>
        </div>
      </nav>

      <div className="pt-20 pb-16 max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#e5e5e5] mb-2">작품 탐색</h1>
        <p className="text-sm text-[#888] mb-6">125 케이스 코드로 분류된 작품을 탐색하세요</p>

        {/* ── 필터 바 ── */}
        <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4 mb-6 space-y-4">
          {/* 검색 */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="작품명, 작가명 검색..."
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2.5 text-sm text-[#e5e5e5] placeholder-[#555] focus:border-[#c8a45e]/50 focus:outline-none"
            />
            <svg className="absolute left-3 top-3 w-4 h-4 text-[#555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* 오행 필터 */}
          <div>
            <label className="text-[10px] text-[#666] uppercase tracking-wider mb-2 block">오행 Element</label>
            <ElementFilter selected={element} onChange={setElement} />
          </div>

          {/* 에너지 + 스타일 필터 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[#666] uppercase tracking-wider mb-2 block">에너지 Energy</label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setEnergy(null)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                    energy === null ? 'bg-[#c8a45e] text-black font-bold' : 'bg-[#1a1a1a] text-[#888] border border-[#2a2a2a]'
                  }`}
                >
                  전체
                </button>
                {([1, 2, 3, 4, 5] as EnergyLevel[]).map(en => (
                  <button
                    key={en}
                    onClick={() => setEnergy(energy === en ? null : en)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                      energy === en ? 'bg-[#c8a45e] text-black font-bold' : 'bg-[#1a1a1a] text-[#888] border border-[#2a2a2a]'
                    }`}
                    title={ENERGY_MAP[en].labelKor}
                  >
                    {en}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#666] uppercase tracking-wider mb-2 block">스타일 Style</label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setStyle(null)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                    style === null ? 'bg-[#c8a45e] text-black font-bold' : 'bg-[#1a1a1a] text-[#888] border border-[#2a2a2a]'
                  }`}
                >
                  전체
                </button>
                {(['S1', 'S2', 'S3', 'S4', 'S5'] as StyleCode[]).map(st => (
                  <button
                    key={st}
                    onClick={() => setStyle(style === st ? null : st)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                      style === st ? 'bg-[#c8a45e] text-black font-bold' : 'bg-[#1a1a1a] text-[#888] border border-[#2a2a2a]'
                    }`}
                    title={STYLE_MAP[st].labelKor}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 활성 필터 요약 */}
          {(element || energy || style) && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#888]">필터:</span>
              {element && (
                <span className="px-2 py-0.5 rounded-full text-[10px]"
                  style={{ background: `${ELEMENT_MAP[element].color}20`, color: ELEMENT_MAP[element].color }}>
                  {ELEMENT_MAP[element].labelKor}
                </span>
              )}
              {energy && (
                <span className="px-2 py-0.5 rounded-full bg-[#c8a45e]/10 text-[#c8a45e] text-[10px]">
                  E{energy} {ENERGY_MAP[energy].labelKor}
                </span>
              )}
              {style && (
                <span className="px-2 py-0.5 rounded-full bg-[#c8a45e]/10 text-[#c8a45e] text-[10px]">
                  {style} {STYLE_MAP[style].labelKor}
                </span>
              )}
              <button
                onClick={() => { setElement(null); setEnergy(null); setStyle(null); setSearch('') }}
                className="text-[#555] hover:text-[#c8a45e] transition-colors ml-1"
              >
                초기화
              </button>
            </div>
          )}
        </div>

        {/* ── 결과 수 ── */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-[#888]">{total}개 작품</span>
        </div>

        {/* ── 작품 그리드 ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <div className="shimmer aspect-[3/4] rounded-lg" />
                <div className="p-3 space-y-2">
                  <div className="shimmer h-4 w-3/4 rounded" />
                  <div className="shimmer h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : artworks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {artworks.map((artwork: any) => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-4xl mb-4 opacity-40">🎨</div>
            <p className="text-[#888] text-sm">등록된 작품이 없습니다</p>
            <Link href="/admin" className="inline-block mt-4 text-xs text-[#c8a45e] hover:underline">
              작품 등록하러 가기 →
            </Link>
          </div>
        )}

        {/* ── 페이지네이션 ── */}
        {total > limit && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-xs bg-[#141414] border border-[#2a2a2a] text-[#888] disabled:opacity-30 hover:border-[#c8a45e]/40 transition-all"
            >
              이전
            </button>
            <span className="text-xs text-[#888]">
              {page + 1} / {Math.ceil(total / limit)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * limit >= total}
              className="px-3 py-1.5 rounded-lg text-xs bg-[#141414] border border-[#2a2a2a] text-[#888] disabled:opacity-30 hover:border-[#c8a45e]/40 transition-all"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
