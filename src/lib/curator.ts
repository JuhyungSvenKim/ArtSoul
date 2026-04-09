import { callGemini } from "./gemini";

export interface CuratorInput {
  title: string;
  artistName?: string;
  genre?: string;
  subject?: string;
  style?: string;
  color?: string;
  energy?: string;
  primaryOhaeng?: string;
  secondaryOhaeng?: string;
  eumYang?: string;
  sizeCmW?: number;
  sizeCmH?: number;
  userDescription?: string;
}

export interface SajuCuratorInput {
  artworkTitle: string;
  artworkElement: string;     // 목/화/토/금/수
  artworkEnergy: string;      // 여백형/안정형/역동형 등
  artworkStyle: string;       // 스타일
  userDayOh: string;          // 유저 일간 오행
  userDayStrength: string;    // 강/중/약
  userYongsin: string;        // 용신 오행
  matchScore: number;         // 매칭 점수
}

// ── 작품 등록용 큐레이터 (일반) ─────────────────

const CURATOR_INSTRUCTION = `[큐레이터 모드] 아래 작품 정보를 보고, MZ세대 힙한 갤러리 큐레이터처럼 위트 있고 재미있는 작품 설명을 3~4문장으로 작성해줘.

규칙:
- 첫 문장은 후킹. 스크롤 멈추게 만들어 ("퇴근길 한강 석양을 캔버스에 납치해왔습니다" 같은)
- 재료나 기법을 힙하게 한 줄 넣어 ("유화 특유의 텍스처가 조명 받으면 미쳐요 진짜")
- 오행 정보가 있으면 바이브/에너지로 풀어 ("물 기운이 충만해서 보고 있으면 마음이 정화되는 느낌"). "오행"이란 단어 직접 사용 금지
- 마지막은 공간 추천 or 한 줄 드립 ("재택근무 배경으로 걸면 줌 미팅 분위기 상승 보장")
- 반말+존댓말 믹스 OK, 약간의 과장과 드립 환영, 작품 리스펙은 유지
- 마크다운/이모지/번호 금지. "이 작품은"으로 시작 금지. 올드한 미술 용어(조형미, 심미적) 금지
- 가격 언급 금지. 작가 이름 반복 금지
- 작가가 쓴 설명이 있으면 의도를 살리되 더 재미있게 각색

작품 정보:
`;

function buildArtworkInfo(artwork: CuratorInput): string {
  const parts = [`작품명: ${artwork.title}`];
  if (artwork.artistName) parts.push(`작가: ${artwork.artistName}`);
  if (artwork.genre) parts.push(`장르/재료: ${artwork.genre}`);
  if (artwork.subject) parts.push(`소재: ${artwork.subject}`);
  if (artwork.style) parts.push(`표현 스타일: ${artwork.style}`);
  if (artwork.color) parts.push(`색감/톤: ${artwork.color}`);
  if (artwork.energy) parts.push(`구도/기운: ${artwork.energy}`);
  if (artwork.primaryOhaeng) parts.push(`주 오행: ${artwork.primaryOhaeng}`);
  if (artwork.secondaryOhaeng) parts.push(`보조 오행: ${artwork.secondaryOhaeng}`);
  if (artwork.eumYang) parts.push(`음양: ${artwork.eumYang}`);
  if (artwork.sizeCmW && artwork.sizeCmH) parts.push(`크기: ${artwork.sizeCmW}×${artwork.sizeCmH}cm`);
  if (artwork.userDescription) parts.push(`작가의 설명: ${artwork.userDescription}`);
  return parts.join('\n');
}

/** 작품 등록 시 일반 큐레이터 설명 생성 */
export async function generateCuratorDescription(artwork: CuratorInput): Promise<string> {
  const prompt = CURATOR_INSTRUCTION + buildArtworkInfo(artwork);
  return callGemini(prompt);
}

// ── 사주 맞춤 큐레이터 (개인화) ─────────────────

const SAJU_CURATOR_INSTRUCTION = `[사주 큐레이터 모드] 아래 "나의 사주"와 "추천 작품" 정보를 보고, 왜 이 그림이 나한테 좋은지를 MZ 감성으로 설명해줘. 3~4문장.

규칙:
- 첫 문장은 "너한테 이 그림이 필요한 이유 한 줄 요약" 느낌
  예: "일간이 불인데 불만 가득한 사주라, 이 물 기운 가득한 그림이 소화제 같은 존재예요."
  예: "당신 사주에 목이 말랐는데, 이 그림이 시원한 숲길 산책 효과를 줍니다."
- 두 번째 문장은 사주의 구체적인 상황(일간 강약, 용신)과 작품의 에너지가 어떻게 맞물리는지 설명
  예: "일간 금이 약한 편인데, 이 작품의 차분한 금속성 에너지가 딱 부족한 걸 채워줘요."
- 세 번째는 실생활 효과 ("집에 걸어두면 결정 장애 줄어들 수 있음" 같은)
- "오행"이란 단어 직접 사용 금지. 기운, 에너지, 바이브로 표현
- "사주"라는 단어는 써도 됨
- 마크다운/이모지 금지
- 점수가 90 이상이면 강력 추천 톤, 80대면 꽤 잘 맞는 톤, 70대면 색다른 자극 톤

`;

/** 사주 맞춤 큐레이터 노트 생성 */
export async function generateSajuCuratorNote(input: SajuCuratorInput): Promise<string> {
  const prompt = SAJU_CURATOR_INSTRUCTION + [
    `작품명: ${input.artworkTitle}`,
    `작품 에너지 계열: ${input.artworkElement}`,
    `작품 에너지 강도: ${input.artworkEnergy}`,
    `작품 스타일: ${input.artworkStyle}`,
    `매칭 점수: ${input.matchScore}점`,
    ``,
    `나의 일간 오행: ${input.userDayOh}`,
    `일간 강약: ${input.userDayStrength}`,
    `용신(필요한 기운): ${input.userYongsin}`,
  ].join('\n');

  return callGemini(prompt);
}

// ── 캐시 ────────────────────────────────────────

const CACHE_PREFIX = "artsoul-curator-cache-";

export function getCachedNote(key: string): string | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { text, ts } = JSON.parse(raw);
    // 7일 캐시
    if (Date.now() - ts > 7 * 24 * 60 * 60 * 1000) return null;
    return text;
  } catch { return null; }
}

export function setCachedNote(key: string, text: string) {
  localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ text, ts: Date.now() }));
}
