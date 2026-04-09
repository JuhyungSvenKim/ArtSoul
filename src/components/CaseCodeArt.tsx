/**
 * 125 Case Code SVG Art Generator
 *
 * 오행(색상) × 에너지(구도) × 스타일(표현)을 조합해 고유한 추상화 생성
 */
import type { OhaengElement, EnergyLevel, StyleCode } from "@/lib/case-code/types";

interface CaseCodeArtProps {
  element: OhaengElement;
  energy: EnergyLevel;
  style: StyleCode;
  size?: number;
  className?: string;
}

// 오행별 색상 팔레트
const PALETTES: Record<OhaengElement, { primary: string; secondary: string; accent: string; bg: string }> = {
  W: { primary: "#4a9e6e", secondary: "#2d6e4a", accent: "#8fd4a8", bg: "#1a2f22" },
  F: { primary: "#d45050", secondary: "#a03030", accent: "#f09090", bg: "#2f1a1a" },
  E: { primary: "#c49a3c", secondary: "#8a6a1c", accent: "#e4c47c", bg: "#2f2a1a" },
  M: { primary: "#a0a0a0", secondary: "#707070", accent: "#d0d0d0", bg: "#1e1e22" },
  A: { primary: "#4a7eb5", secondary: "#2a5e95", accent: "#8ab8e5", bg: "#1a222f" },
};

// 시드 기반 간단한 난수 (deterministic)
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getSeed(el: OhaengElement, en: EnergyLevel, st: StyleCode): number {
  return el.charCodeAt(0) * 10000 + en * 1000 + st.charCodeAt(1) * 100;
}

// 에너지별 구도 생성
function generateShapes(
  rand: () => number,
  energy: EnergyLevel,
  style: StyleCode,
  p: typeof PALETTES.W,
  size: number,
): string {
  const shapes: string[] = [];
  const s = size;

  // 에너지별 도형 수
  const countMap: Record<EnergyLevel, number> = { 1: 3, 2: 6, 3: 10, 4: 8, 5: 15 };
  const count = countMap[energy];

  for (let i = 0; i < count; i++) {
    const x = rand() * s;
    const y = rand() * s;
    const color = [p.primary, p.secondary, p.accent][Math.floor(rand() * 3)];
    const opacity = 0.3 + rand() * 0.5;

    // 스타일별 도형 유형
    switch (style) {
      case "S1": { // 고전 — 원과 곡선
        const r = 15 + rand() * 40;
        shapes.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${opacity}" />`);
        if (rand() > 0.5) {
          shapes.push(`<circle cx="${x}" cy="${y}" r="${r * 0.6}" fill="none" stroke="${p.accent}" stroke-width="0.5" opacity="${opacity * 0.6}" />`);
        }
        break;
      }
      case "S2": { // 동양 수묵 — 선과 여백
        const x2 = x + (rand() - 0.5) * 100;
        const y2 = y + (rand() - 0.5) * 80;
        const sw = 1 + rand() * 4;
        shapes.push(`<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}" opacity="${opacity * 0.7}" stroke-linecap="round" />`);
        if (rand() > 0.6) {
          const cr = 3 + rand() * 8;
          shapes.push(`<circle cx="${x2}" cy="${y2}" r="${cr}" fill="${color}" opacity="${opacity * 0.4}" />`);
        }
        break;
      }
      case "S3": { // 모던 미니멀 — 직사각형, 깔끔한 선
        const w = 20 + rand() * 60;
        const h = 20 + rand() * 60;
        shapes.push(`<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" fill="${color}" opacity="${opacity * 0.6}" rx="2" />`);
        break;
      }
      case "S4": { // 팝 — 대담한 원, 강렬한 색
        const r = 20 + rand() * 50;
        shapes.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${opacity * 0.8}" />`);
        if (rand() > 0.4) {
          shapes.push(`<circle cx="${x}" cy="${y}" r="${r * 0.5}" fill="${p.bg}" opacity="0.8" />`);
          shapes.push(`<circle cx="${x}" cy="${y}" r="${r * 0.3}" fill="${p.accent}" opacity="0.9" />`);
        }
        break;
      }
      case "S5": { // 프리미엄 — 다이아몬드, 복합 패턴
        const r = 15 + rand() * 30;
        const angle = rand() * Math.PI;
        shapes.push(`<polygon points="${x},${y - r} ${x + r * 0.6},${y} ${x},${y + r} ${x - r * 0.6},${y}" fill="${color}" opacity="${opacity * 0.7}" transform="rotate(${angle * 57.3} ${x} ${y})" />`);
        break;
      }
    }
  }

  // 에너지별 추가 효과
  switch (energy) {
    case 1: // 여백 — 중앙 한 점
      shapes.push(`<circle cx="${s / 2}" cy="${s / 2}" r="${s * 0.12}" fill="${p.primary}" opacity="0.15" />`);
      break;
    case 2: // 균형 — 수평선
      shapes.push(`<line x1="0" y1="${s / 2}" x2="${s}" y2="${s / 2}" stroke="${p.accent}" stroke-width="0.5" opacity="0.2" />`);
      shapes.push(`<line x1="${s / 2}" y1="0" x2="${s / 2}" y2="${s}" stroke="${p.accent}" stroke-width="0.5" opacity="0.2" />`);
      break;
    case 3: // 역동 — 사선
      shapes.push(`<line x1="0" y1="${s}" x2="${s}" y2="0" stroke="${p.accent}" stroke-width="1" opacity="0.15" />`);
      break;
    case 4: // 유동 — 곡선
      shapes.push(`<path d="M 0,${s * 0.6} Q ${s * 0.3},${s * 0.2} ${s * 0.6},${s * 0.5} T ${s},${s * 0.4}" fill="none" stroke="${p.accent}" stroke-width="1.5" opacity="0.2" />`);
      break;
    case 5: // 밀도 — 그리드 패턴
      for (let gx = 0; gx < 5; gx++) {
        for (let gy = 0; gy < 5; gy++) {
          shapes.push(`<rect x="${gx * s / 5}" y="${gy * s / 5}" width="${s / 5}" height="${s / 5}" fill="none" stroke="${p.accent}" stroke-width="0.3" opacity="0.1" />`);
        }
      }
      break;
  }

  return shapes.join("\n");
}

export default function CaseCodeArt({ element, energy, style, size = 200, className = "" }: CaseCodeArtProps) {
  const p = PALETTES[element];
  const seed = getSeed(element, energy, style);
  const rand = seededRandom(seed);
  const shapes = generateShapes(rand, energy, style, p, size);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      className={className}
      style={{ borderRadius: "12px" }}
    >
      <defs>
        <linearGradient id={`bg-${element}${energy}${style}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={p.bg} />
          <stop offset="100%" stopColor={p.secondary} stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <rect width={size} height={size} fill={`url(#bg-${element}${energy}${style})`} />
      <g dangerouslySetInnerHTML={{ __html: shapes }} />
    </svg>
  );
}

// 인라인 SVG 문자열 생성 (이미지 URL 대용)
export function generateCaseCodeSvgString(element: OhaengElement, energy: EnergyLevel, style: StyleCode): string {
  const p = PALETTES[element];
  const seed = getSeed(element, energy, style);
  const rand = seededRandom(seed);
  const size = 200;
  const shapes = generateShapes(rand, energy, style, p, size);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${p.bg}"/><stop offset="100%" stop-color="${p.secondary}" stop-opacity="0.3"/></linearGradient></defs>
    <rect width="${size}" height="${size}" fill="url(#bg)"/>
    ${shapes}
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
