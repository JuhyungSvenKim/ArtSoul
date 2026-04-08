'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ELEMENT_MAP, ENERGY_MAP, STYLE_MAP, SPACE_TYPES, buildCaseCode,
} from '@/lib/case-code/types'
import type { OhaengElement, EnergyLevel, StyleCode, SpaceType } from '@/lib/case-code/types'
import ArtworkImage from '@/components/ArtworkImage'
import CaseCodeBadge from '@/components/CaseCodeBadge'

export default function AdminPage() {
  const [form, setForm] = useState({
    title: '',
    artist: '',
    description: '',
    element: 'W' as OhaengElement,
    energy: 1 as EnergyLevel,
    style: 'S3' as StyleCode,
    image_url: '',
    tags: '',
    space_type: '' as string,
    price_range: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [recentArtworks, setRecentArtworks] = useState<any[]>([])

  const caseCode = buildCaseCode(form.element, form.energy, form.style)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
          space_type: form.space_type || null,
          image_url: form.image_url || null,
          price_range: form.price_range || null,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: `작품 등록 완료! (${caseCode})` })
        setRecentArtworks(prev => [data.artwork, ...prev].slice(0, 10))
        setForm(f => ({ ...f, title: '', artist: '', description: '', image_url: '', tags: '', price_range: '' }))
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    }
    setSaving(false)
  }

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#2a2a2a]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-[#c8a45e] font-bold text-lg tracking-tight">ART.D.N.A.</Link>
          <div className="flex gap-6 text-sm">
            <Link href="/" className="text-[#888] hover:text-[#c8a45e] transition-colors">홈</Link>
            <Link href="/explore" className="text-[#888] hover:text-[#c8a45e] transition-colors">탐색</Link>
            <span className="text-[#c8a45e]">관리</span>
          </div>
        </div>
      </nav>

      <div className="pt-20 pb-16 max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#e5e5e5] mb-2">작품 등록</h1>
        <p className="text-sm text-[#888] mb-8">5축 선택으로 125 케이스 코드가 자동 생성됩니다</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 좌측: 입력 폼 */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {/* 기본 정보 */}
            <fieldset className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-5 space-y-4">
              <legend className="text-sm font-semibold text-[#c8a45e] px-2">기본 정보</legend>

              <div>
                <label className="text-xs text-[#888] mb-1 block">작품명 *</label>
                <input
                  type="text" required value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] focus:border-[#c8a45e]/50 focus:outline-none"
                  placeholder="예: 새벽 안개의 호수"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#888] mb-1 block">작가명</label>
                  <input
                    type="text" value={form.artist}
                    onChange={e => setForm({ ...form, artist: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] focus:border-[#c8a45e]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#888] mb-1 block">이미지 URL</label>
                  <input
                    type="url" value={form.image_url}
                    onChange={e => setForm({ ...form, image_url: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] focus:border-[#c8a45e]/50 focus:outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#888] mb-1 block">설명</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] focus:border-[#c8a45e]/50 focus:outline-none resize-none"
                />
              </div>
            </fieldset>

            {/* ── 5축 선택 ── */}
            <fieldset className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-5 space-y-5">
              <legend className="text-sm font-semibold text-[#c8a45e] px-2">125 케이스 코드</legend>

              {/* 축1: 오행 Element */}
              <div>
                <label className="text-xs text-[#888] mb-2 block">오행 (Element)</label>
                <div className="grid grid-cols-5 gap-2">
                  {(['W', 'F', 'E', 'M', 'A'] as OhaengElement[]).map(el => {
                    const info = ELEMENT_MAP[el]
                    const active = form.element === el
                    return (
                      <button
                        key={el} type="button"
                        onClick={() => setForm({ ...form, element: el })}
                        className={`py-3 rounded-lg text-center transition-all border ${
                          active ? 'border-2' : 'border-[#2a2a2a] hover:border-[#333]'
                        }`}
                        style={active ? { borderColor: info.color, background: `${info.color}15` } : {}}
                      >
                        <div className="text-lg mb-0.5">{{ W: '🌿', F: '🔥', E: '🏔️', M: '⚔️', A: '💧' }[el]}</div>
                        <div className="text-xs font-bold" style={{ color: active ? info.color : '#888' }}>{el}</div>
                        <div className="text-[10px] text-[#666]">{info.labelKor}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 축2: 에너지 */}
              <div>
                <label className="text-xs text-[#888] mb-2 block">에너지 (Energy 1~5)</label>
                <div className="grid grid-cols-5 gap-2">
                  {([1, 2, 3, 4, 5] as EnergyLevel[]).map(en => {
                    const info = ENERGY_MAP[en]
                    const active = form.energy === en
                    return (
                      <button
                        key={en} type="button"
                        onClick={() => setForm({ ...form, energy: en })}
                        className={`py-3 rounded-lg text-center transition-all border ${
                          active ? 'bg-[#c8a45e]/10 border-[#c8a45e]' : 'border-[#2a2a2a] hover:border-[#333]'
                        }`}
                      >
                        <div className={`text-sm font-bold ${active ? 'text-[#c8a45e]' : 'text-[#888]'}`}>{en}</div>
                        <div className="text-[10px] text-[#666]">{info.labelKor}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 축3: 스타일 */}
              <div>
                <label className="text-xs text-[#888] mb-2 block">스타일 (Style)</label>
                <div className="grid grid-cols-5 gap-2">
                  {(['S1', 'S2', 'S3', 'S4', 'S5'] as StyleCode[]).map(st => {
                    const info = STYLE_MAP[st]
                    const active = form.style === st
                    return (
                      <button
                        key={st} type="button"
                        onClick={() => setForm({ ...form, style: st })}
                        className={`py-3 rounded-lg text-center transition-all border ${
                          active ? 'bg-[#c8a45e]/10 border-[#c8a45e]' : 'border-[#2a2a2a] hover:border-[#333]'
                        }`}
                      >
                        <div className={`text-xs font-bold ${active ? 'text-[#c8a45e]' : 'text-[#888]'}`}>{st}</div>
                        <div className="text-[10px] text-[#666]">{info.labelKor}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </fieldset>

            {/* 부가 정보 */}
            <fieldset className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-5 space-y-4">
              <legend className="text-sm font-semibold text-[#c8a45e] px-2">부가 정보</legend>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#888] mb-1 block">공간 유형</label>
                  <select
                    value={form.space_type}
                    onChange={e => setForm({ ...form, space_type: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] focus:border-[#c8a45e]/50 focus:outline-none"
                  >
                    <option value="">선택안함</option>
                    {SPACE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#888] mb-1 block">가격대</label>
                  <input
                    type="text" value={form.price_range}
                    onChange={e => setForm({ ...form, price_range: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] focus:border-[#c8a45e]/50 focus:outline-none"
                    placeholder="예: 50~100만원"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#888] mb-1 block">태그 (콤마 구분)</label>
                <input
                  type="text" value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] focus:border-[#c8a45e]/50 focus:outline-none"
                  placeholder="예: 추상, 미니멀, 블루"
                />
              </div>
            </fieldset>

            {/* 메시지 + 제출 */}
            {message && (
              <div className={`rounded-lg p-3 text-sm ${
                message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit" disabled={saving || !form.title}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#c8a45e] to-[#a68a3e] text-black font-bold text-sm
                hover:from-[#dbb978] hover:to-[#c8a45e] disabled:opacity-40 transition-all"
            >
              {saving ? '저장 중...' : '작품 등록'}
            </button>
          </form>

          {/* 우측: 미리보기 */}
          <div className="space-y-4">
            <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4 sticky top-20">
              <h3 className="text-sm font-semibold text-[#c8a45e] mb-3">미리보기</h3>

              <ArtworkImage
                src={form.image_url || null}
                alt={form.title || '미리보기'}
                element={form.element}
              />

              <div className="mt-3">
                <h4 className="text-sm font-semibold text-[#e5e5e5]">{form.title || '작품명'}</h4>
                <p className="text-xs text-[#888] mt-0.5">{form.artist || '작가명'}</p>

                <div className="mt-2">
                  <CaseCodeBadge caseCode={caseCode} showLabel />
                </div>

                <div className="mt-3 space-y-1 text-[10px] text-[#666]">
                  <div>오행: {ELEMENT_MAP[form.element].labelKor}</div>
                  <div>에너지: {ENERGY_MAP[form.energy].labelKor} — {ENERGY_MAP[form.energy].description}</div>
                  <div>스타일: {STYLE_MAP[form.style].labelKor} — {STYLE_MAP[form.style].description}</div>
                </div>
              </div>
            </div>

            {/* 최근 등록 */}
            {recentArtworks.length > 0 && (
              <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4">
                <h3 className="text-sm font-semibold text-[#c8a45e] mb-3">최근 등록</h3>
                <div className="space-y-2">
                  {recentArtworks.map((a: any) => (
                    <div key={a.id} className="flex items-center gap-2 text-xs">
                      <CaseCodeBadge caseCode={a.case_code} size="sm" />
                      <span className="text-[#e5e5e5] truncate">{a.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
