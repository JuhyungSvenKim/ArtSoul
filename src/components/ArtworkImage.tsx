'use client'

import { useState } from 'react'
import type { OhaengElement } from '@/lib/case-code/types'
import { ELEMENT_MAP } from '@/lib/case-code/types'
import { getOptimizedImageUrl, getImageSrcSet } from '@/lib/image-cdn'
import type { ImageSize } from '@/lib/image-cdn'

interface ArtworkImageProps {
  src: string | null | undefined
  alt: string
  element?: OhaengElement
  className?: string
  priority?: boolean
  size?: ImageSize
}

/**
 * 작품 이미지 컴포넌트
 * - 3:4 비율 고정
 * - 로딩 shimmer 효과
 * - 이미지 없으면 오행 컬러 그라데이션 placeholder
 */
export default function ArtworkImage({ src, alt, element, className = '', size = 'medium' }: ArtworkImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const optimizedSrc = getOptimizedImageUrl(src, size)
  const srcSet = getImageSrcSet(src)
  const showPlaceholder = !src || error

  const gradient = element
    ? ELEMENT_MAP[element]?.colorGradient
    : ['#2a2a2a', '#3a3a3a']

  const ohaengIcon = element ? OHAENG_ICONS[element] : '🎨'

  return (
    <div className={`relative overflow-hidden rounded-lg bg-[#141414] ${className}`} style={{ aspectRatio: '3/4' }}>
      {/* Shimmer 로딩 */}
      {!showPlaceholder && !loaded && (
        <div className="absolute inset-0 shimmer" />
      )}

      {/* 실제 이미지 */}
      {!showPlaceholder && (
        <img
          src={optimizedSrc!}
          srcSet={srcSet || undefined}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      {/* 오행 그라데이션 Placeholder */}
      {showPlaceholder && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
          }}
        >
          <span className="text-4xl mb-2 opacity-60">{ohaengIcon}</span>
          <span className="text-xs text-white/40 font-medium tracking-wider uppercase">
            {element ? ELEMENT_MAP[element].label : 'ART'}
          </span>
        </div>
      )}

      {/* 하단 그라데이션 오버레이 */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
    </div>
  )
}

const OHAENG_ICONS: Record<OhaengElement, string> = {
  W: '🌿',
  F: '🔥',
  E: '🏔️',
  M: '⚔️',
  A: '💧',
}

/**
 * 작품 카드 (이미지 + 정보)
 */
export function ArtworkCard({
  artwork,
  matchScore,
  onClick,
}: {
  artwork: { title: string; artist: string; case_code: string; element: string; image_url: string | null }
  matchScore?: number
  onClick?: () => void
}) {
  const el = artwork.element as OhaengElement
  const elInfo = ELEMENT_MAP[el]

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl overflow-hidden bg-[#141414] border border-[#2a2a2a] hover:border-[#c8a45e]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#c8a45e]/5"
    >
      <ArtworkImage src={artwork.image_url} alt={artwork.title} element={el} />

      <div className="p-3">
        <h3 className="text-sm font-semibold text-[#e5e5e5] truncate group-hover:text-[#c8a45e] transition-colors">
          {artwork.title}
        </h3>
        <p className="text-xs text-[#888] mt-0.5 truncate">{artwork.artist}</p>

        <div className="flex items-center justify-between mt-2">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: `${elInfo?.color}20`, color: elInfo?.color }}
          >
            {artwork.case_code}
          </span>

          {matchScore !== undefined && (
            <span className="text-[10px] text-[#c8a45e] font-bold">
              {matchScore}점
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
