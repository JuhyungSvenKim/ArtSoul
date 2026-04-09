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

/**
 * 큐레이터 엔진: 기존 gemini API를 활용하여 작품 설명 자동 생성
 */
export async function generateCuratorDescription(artwork: CuratorInput): Promise<string> {
  const prompt = CURATOR_INSTRUCTION + buildArtworkInfo(artwork);
  return callGemini(prompt);
}
