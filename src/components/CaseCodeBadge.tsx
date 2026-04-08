'use client'

import type { OhaengElement, EnergyLevel, StyleCode } from '@/lib/case-code/types'
import { ELEMENT_MAP, ENERGY_MAP, STYLE_MAP, parseCaseCode } from '@/lib/case-code/types'

interface CaseCodeBadgeProps {
  caseCode: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function CaseCodeBadge({ caseCode, size = 'md', showLabel = false }: CaseCodeBadgeProps) {
  const parsed = parseCaseCode(caseCode)
  if (!parsed) return <span className="text-[#888]">{caseCode}</span>

  const elInfo = ELEMENT_MAP[parsed.element]
  const enInfo = ENERGY_MAP[parsed.energy]
  const stInfo = STYLE_MAP[parsed.style]

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }

  return (
    <div className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]}`}
      style={{ background: `${elInfo.color}15`, border: `1px solid ${elInfo.color}30` }}>
      <span style={{ color: elInfo.color }}>{parsed.element}{parsed.energy}</span>
      <span className="text-[#888]">·</span>
      <span className="text-[#e5e5e5]">{parsed.style}</span>
      {showLabel && (
        <span className="text-[#888] ml-1">
          {elInfo.labelKor} × {enInfo.labelKor} × {stInfo.labelKor}
        </span>
      )}
    </div>
  )
}

/**
 * 오행 Element 필터 버튼들
 */
export function ElementFilter({
  selected,
  onChange,
}: {
  selected: OhaengElement | null
  onChange: (el: OhaengElement | null) => void
}) {
  const elements: OhaengElement[] = ['W', 'F', 'E', 'M', 'A']

  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          selected === null
            ? 'bg-[#c8a45e] text-black'
            : 'bg-[#1a1a1a] text-[#888] border border-[#2a2a2a] hover:border-[#c8a45e]/40'
        }`}
      >
        전체
      </button>
      {elements.map(el => {
        const info = ELEMENT_MAP[el]
        const isActive = selected === el
        return (
          <button
            key={el}
            onClick={() => onChange(isActive ? null : el)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isActive
                ? 'text-white'
                : 'bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#c8a45e]/40'
            }`}
            style={isActive ? { background: info.color, color: '#fff' } : { color: info.color }}
          >
            {info.labelKor}
          </button>
        )
      })}
    </div>
  )
}
