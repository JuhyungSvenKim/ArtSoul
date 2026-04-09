/**
 * 작품 5축 분류 → 오행 자동 매핑 엔진 v2
 *
 * 전통+현대 미술 통합, 속성 기반(Feature-based) 시스템
 * 작가/어드민은 5축만 선택 → 사주 연결은 엔진이 자동 계산
 */

// ═══════════════════════════════════════════════════
// 1️⃣ Medium (재료 + 제작 방식 + 물성)
// ═══════════════════════════════════════════════════
export const MEDIUM_OPTIONS = [
  { value: "유화", label: "유화 · 템페라", desc: "두껍고 깊은 질감, 서양 고전" },
  { value: "수묵화", label: "수묵화 · 채색화", desc: "먹과 여백, 동양 전통" },
  { value: "아크릴", label: "아크릴 · 현대 캔버스", desc: "선명하고 현대적" },
  { value: "판화", label: "판화 · 에디션", desc: "실크스크린, 리소그래피" },
  { value: "믹스드", label: "믹스드 · 텍스처", desc: "콜라주, 오브제" },
  { value: "디지털", label: "디지털 · AI 아트", desc: "디지털 생성, AI" },
] as const;

// 2️⃣ Subject (소재 + 상징 의미)
export const SUBJECT_OPTIONS = [
  { value: "자연풍경", label: "자연 · 풍경", desc: "산, 물, 하늘, 대지" },
  { value: "인물", label: "인물 · 초상", desc: "현대 인물, 초상화" },
  { value: "추상", label: "추상 · 비구상", desc: "비구상, 기하, 정신성" },
  { value: "정물", label: "정물 · 사물", desc: "물건, 재물, 일상" },
  { value: "동식물", label: "동물 · 식물", desc: "생명성, 자연물" },
] as const;

// 3️⃣ Style (전통 + 현대 표현 코드)
export const STYLE_OPTIONS = [
  { value: "사실주의", label: "사실주의", desc: "정확한 묘사, 질서" },
  { value: "수묵여백", label: "수묵 · 여백", desc: "동양적 여백미" },
  { value: "인상주의", label: "인상주의", desc: "빛과 순간의 포착" },
  { value: "표현주의", label: "표현주의", desc: "감정 폭발, 강렬함" },
  { value: "미니멀", label: "미니멀리즘", desc: "절제, 본질" },
  { value: "컨템포러리", label: "컨템포러리 추상", desc: "현대 추상 표현" },
  { value: "팝아트", label: "팝아트", desc: "대중문화, 강렬한 색" },
  { value: "동양모던", label: "동양 모던", desc: "수묵 미니멀, 현대 동양" },
] as const;

// 4️⃣ Color & Tone (색 + 명도 + 채도)
export const COLOR_OPTIONS = [
  { value: "뉴트럴", label: "뉴트럴", desc: "베이지, 그레이" },
  { value: "어스톤", label: "어스톤", desc: "브라운, 테라코타" },
  { value: "쿨톤", label: "쿨톤", desc: "블루, 그린 계열" },
  { value: "웜톤", label: "웜톤", desc: "레드, 오렌지 계열" },
  { value: "모노톤", label: "모노톤", desc: "흑백, 단색" },
  { value: "파스텔", label: "파스텔", desc: "연하고 부드러운 색" },
  { value: "비비드", label: "비비드", desc: "강렬하고 선명한 색" },
] as const;

// 5️⃣ Composition & Energy (구도 + 기운)
export const ENERGY_OPTIONS = [
  { value: "여백", label: "여백형", desc: "동양화 핵심, 비움의 미학" },
  { value: "균형", label: "균형형", desc: "고전 회화, 안정적 구성" },
  { value: "역동", label: "역동형", desc: "현대/표현주의, 움직임" },
  { value: "유동", label: "유동형", desc: "수채/흐름, 자연스러움" },
  { value: "밀도", label: "밀도형", desc: "복잡한 디테일, 풍성함" },
] as const;

// ═══════════════════════════════════════════════════
// 타입 정의
// ═══════════════════════════════════════════════════

export interface ArtworkAxes {
  medium: string;
  subject: string;
  style: string;
  color: string;
  energy: string;
}

export interface OhaengScores {
  목: number;
  화: number;
  토: number;
  금: number;
  수: number;
}

// ═══════════════════════════════════════════════════
// 오행 매핑 테이블 (각 축 20점, 총 100점)
// ═══════════════════════════════════════════════════

// [1] Medium → 오행의 "물성"
const MEDIUM_MAP: Record<string, OhaengScores> = {
  유화:     { 목: 0, 화: 2, 토: 10, 금: 6, 수: 2 },  // 두꺼움 = 토+금
  수묵화:   { 목: 8, 화: 0, 토: 0, 금: 0, 수: 12 },  // 먹+여백 = 수+목
  아크릴:   { 목: 2, 화: 12, 토: 2, 금: 2, 수: 2 },  // 선명+빠름 = 화
  판화:     { 목: 2, 화: 2, 토: 2, 금: 12, 수: 2 },  // 구조+반복 = 금
  믹스드:   { 목: 4, 화: 4, 토: 8, 금: 2, 수: 2 },   // 물질적 = 토
  디지털:   { 목: 0, 화: 4, 토: 0, 금: 12, 수: 4 },  // 정밀+기술 = 금
};

// [2] Subject → 운의 "방향"
const SUBJECT_MAP: Record<string, OhaengScores> = {
  자연풍경: { 목: 8, 화: 2, 토: 4, 금: 0, 수: 6 },   // 자연 = 목+수+토
  인물:     { 목: 2, 화: 8, 토: 4, 금: 2, 수: 4 },   // 관계/표현 = 화
  추상:     { 목: 4, 화: 4, 토: 0, 금: 4, 수: 8 },   // 정신성 = 수+복합
  정물:     { 목: 2, 화: 0, 토: 12, 금: 4, 수: 2 },  // 재물/현실 = 토
  동식물:   { 목: 10, 화: 4, 토: 2, 금: 0, 수: 4 },  // 생명 = 목
};

// [3] Style → 성향/기질
const STYLE_MAP: Record<string, OhaengScores> = {
  사실주의:   { 목: 0, 화: 0, 토: 4, 금: 14, 수: 2 },  // 정확+질서 = 금
  수묵여백:   { 목: 4, 화: 0, 토: 0, 금: 2, 수: 14 },  // 여백+흐름 = 수
  인상주의:   { 목: 4, 화: 4, 토: 0, 금: 0, 수: 12 },  // 빛+감성 = 수
  표현주의:   { 목: 2, 화: 14, 토: 0, 금: 0, 수: 4 },  // 감정폭발 = 화
  미니멀:     { 목: 0, 화: 0, 토: 2, 금: 10, 수: 8 },  // 절제 = 금+수
  컨템포러리: { 목: 6, 화: 4, 토: 0, 금: 4, 수: 6 },   // 현대추상 = 복합
  팝아트:     { 목: 2, 화: 12, 토: 2, 금: 2, 수: 2 },  // 강렬+대중 = 화
  동양모던:   { 목: 6, 화: 0, 토: 2, 금: 4, 수: 8 },   // 수묵미니멀 = 수+목+금
};

// [4] Color → 오행 직접 매핑 (가장 중요한 축)
const COLOR_MAP: Record<string, OhaengScores> = {
  뉴트럴:   { 목: 2, 화: 2, 토: 8, 금: 6, 수: 2 },   // 베이지/그레이 = 토+금
  어스톤:   { 목: 4, 화: 2, 토: 10, 금: 2, 수: 2 },  // 브라운 = 토
  쿨톤:     { 목: 6, 화: 0, 토: 0, 금: 4, 수: 10 },  // 블루/그린 = 수+목
  웜톤:     { 목: 2, 화: 14, 토: 2, 금: 0, 수: 2 },  // 레드/오렌지 = 화
  모노톤:   { 목: 0, 화: 0, 토: 2, 금: 8, 수: 10 },  // 흑백 = 금+수
  파스텔:   { 목: 6, 화: 4, 토: 4, 금: 2, 수: 4 },   // 부드러움 = 균형(목)
  비비드:   { 목: 2, 화: 12, 토: 2, 금: 2, 수: 2 },  // 강렬 = 화
};

// [5] Energy → 기운 흐름
const ENERGY_MAP: Record<string, OhaengScores> = {
  여백:   { 목: 4, 화: 0, 토: 0, 금: 2, 수: 14 },   // 비움 = 수
  균형:   { 목: 2, 화: 2, 토: 12, 금: 2, 수: 2 },   // 안정 = 토
  역동:   { 목: 4, 화: 12, 토: 0, 금: 0, 수: 4 },   // 움직임 = 화
  유동:   { 목: 4, 화: 2, 토: 0, 금: 0, 수: 14 },   // 흐름 = 수
  밀도:   { 목: 10, 화: 4, 토: 2, 금: 2, 수: 2 },   // 풍성/복잡 = 목
};

// ═══════════════════════════════════════════════════
// 자동 계산 엔진
// ═══════════════════════════════════════════════════

export function calculateOhaengScores(axes: ArtworkAxes): OhaengScores {
  const maps = [
    MEDIUM_MAP[axes.medium],
    SUBJECT_MAP[axes.subject],
    STYLE_MAP[axes.style],
    COLOR_MAP[axes.color],
    ENERGY_MAP[axes.energy],
  ];

  const result: OhaengScores = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const m of maps) {
    if (!m) continue;
    result.목 += m.목;
    result.화 += m.화;
    result.토 += m.토;
    result.금 += m.금;
    result.수 += m.수;
  }
  return result;
}

export function getPrimaryOhaeng(scores: OhaengScores): { primary: string; secondary: string } {
  const sorted = (Object.entries(scores) as [string, number][]).sort((a, b) => b[1] - a[1]);
  return { primary: sorted[0][0], secondary: sorted[1][0] };
}

export function getAutoEumYang(axes: ArtworkAxes): string {
  const yang = ["아크릴", "웜톤", "비비드", "역동", "표현주의", "팝아트"];
  const eum = ["수묵화", "쿨톤", "모노톤", "여백", "미니멀", "수묵여백", "유동"];
  const vals = [axes.medium, axes.color, axes.energy, axes.style];
  const yc = vals.filter(v => yang.includes(v)).length;
  const ec = vals.filter(v => eum.includes(v)).length;
  if (yc > ec) return "양";
  if (ec > yc) return "음";
  return "중성";
}

export function getAutoEnergyLevel(scores: OhaengScores): string {
  const max = Math.max(...Object.values(scores));
  if (max >= 35) return "강";
  if (max >= 22) return "중";
  return "약";
}

// ═══════════════════════════════════════════════════
// 사주-작품 매칭 점수 계산 (사용자 추천용)
// ═══════════════════════════════════════════════════

export function calculateMatchScore(
  userYongsinOhaeng: string,
  userLackingOhaeng: string[],
  artworkScores: OhaengScores
): { score: number; reason: string } {
  const total = Object.values(artworkScores).reduce((a, b) => a + b, 0) || 1;

  // 용신 오행 비율 (40%)
  const yongsinRatio = (artworkScores[userYongsinOhaeng as keyof OhaengScores] || 0) / total;
  const yongsinScore = yongsinRatio * 40;

  // 부족 오행 보완 (30%)
  const lackingSum = userLackingOhaeng.reduce(
    (sum, oh) => sum + (artworkScores[oh as keyof OhaengScores] || 0), 0
  );
  const lackingScore = (lackingSum / total) * 30;

  // 에너지 분산도 (30%) - 균형잡힌 작품이 더 높은 점수
  const values = Object.values(artworkScores);
  const avg = total / 5;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / 5;
  const balanceScore = Math.max(0, 30 - variance * 0.5);

  const score = Math.round(yongsinScore + lackingScore + balanceScore);

  const reasons = [];
  if (yongsinScore > 15) reasons.push(`${userYongsinOhaeng} 기운 보충`);
  if (lackingScore > 10) reasons.push("부족한 오행 보완");
  if (balanceScore > 20) reasons.push("균형잡힌 에너지");

  return {
    score: Math.min(score, 100),
    reason: reasons.join(" · ") || "기본 추천",
  };
}
