/**
 * 125 Sample Artworks — 케이스코드별 대표 작품
 */
import type { OhaengElement, EnergyLevel, StyleCode } from "@/lib/case-code/types";
import { ELEMENT_MAP, ENERGY_MAP, STYLE_MAP, buildCaseCode } from "@/lib/case-code/types";

export interface SampleArtwork {
  id: string;
  title: string;
  artist: string;
  caseCode: string;
  element: OhaengElement;
  energy: EnergyLevel;
  style: StyleCode;
  description: string;
  tags: string[];
  spaceType: string;
}

// 오행별 작품 이름 구성 요소
const TITLE_PARTS: Record<OhaengElement, { subjects: string[]; moods: string[] }> = {
  W: { subjects: ["숲", "대나무", "새벽 안개", "봄꽃", "신록"], moods: ["고요한", "생동하는", "흐르는", "성장하는", "자유로운"] },
  F: { subjects: ["노을", "불꽃", "해바라기", "태양", "용광로"], moods: ["열정의", "타오르는", "빛나는", "뜨거운", "강렬한"] },
  E: { subjects: ["황토 언덕", "도자기", "가을 들판", "옛 마을", "대지"], moods: ["포근한", "묵직한", "따뜻한", "안정된", "깊은"] },
  M: { subjects: ["달빛", "은빛 호수", "겨울 나무", "금속 오브제", "서리"], moods: ["차가운", "맑은", "절제된", "날카로운", "정밀한"] },
  A: { subjects: ["파도", "비 오는 거리", "호수", "수묵 산수", "안개 바다"], moods: ["깊은", "유연한", "잔잔한", "신비로운", "흘러가는"] },
};

const STYLE_SUFFIX: Record<StyleCode, string[]> = {
  S1: ["유화", "아카데미즘", "클래식 정물", "르네상스풍", "명화 재해석"],
  S2: ["수묵화", "동양 수채", "서예 추상", "문인화", "먹의 여운"],
  S3: ["미니멀 아트", "기하학 구성", "화이트 스페이스", "모던 인테리어", "라인 드로잉"],
  S4: ["팝아트", "그래피티 스타일", "네온 콜라주", "디지털 아트", "볼드 프린트"],
  S5: ["오브제 아트", "혼합 매체", "컬렉터 에디션", "금박 텍스처", "프리미엄 판화"],
};

const SPACE_BY_ENERGY: Record<EnergyLevel, string> = {
  1: "침실", 2: "거실", 3: "사무실", 4: "카페", 5: "로비",
};

const ARTIST_NAMES = [
  "김수연", "이현석", "박서연", "최하늘", "정은채", "한지민",
  "오현석", "김태리", "유재석", "이도윤", "강민호", "서지원",
  "윤하영", "임채원", "조현우", "백지은", "송예진", "나혜리",
  "문서준", "황도현", "신유진", "권태영", "장미란", "안소희", "류현진",
];

function generateTitle(el: OhaengElement, en: EnergyLevel, st: StyleCode): string {
  const { subjects, moods } = TITLE_PARTS[el];
  const subject = subjects[(en - 1) % subjects.length];
  const mood = moods[(st.charCodeAt(1) - 49) % moods.length];
  const suffix = STYLE_SUFFIX[st][(en - 1) % STYLE_SUFFIX[st].length];
  return `${mood} ${subject} — ${suffix}`;
}

function generateDescription(el: OhaengElement, en: EnergyLevel, st: StyleCode): string {
  const elInfo = ELEMENT_MAP[el];
  const enInfo = ENERGY_MAP[en];
  const stInfo = STYLE_MAP[st];
  return `${elInfo.labelKor}의 기운을 담은 ${enInfo.labelKor} 에너지의 ${stInfo.labelKor} 작품입니다. ${enInfo.description}`;
}

// 125개 샘플 작품 생성
export function generateAllSampleArtworks(): SampleArtwork[] {
  const elements: OhaengElement[] = ["W", "F", "E", "M", "A"];
  const energies: EnergyLevel[] = [1, 2, 3, 4, 5];
  const styles: StyleCode[] = ["S1", "S2", "S3", "S4", "S5"];
  const artworks: SampleArtwork[] = [];
  let idx = 0;

  for (const el of elements) {
    for (const en of energies) {
      for (const st of styles) {
        const code = buildCaseCode(el, en, st);
        artworks.push({
          id: `sample-${code}`,
          title: generateTitle(el, en, st),
          artist: ARTIST_NAMES[idx % ARTIST_NAMES.length],
          caseCode: code,
          element: el,
          energy: en,
          style: st,
          description: generateDescription(el, en, st),
          tags: [ELEMENT_MAP[el].labelKor, ENERGY_MAP[en].labelKor, STYLE_MAP[st].labelKor],
          spaceType: SPACE_BY_ENERGY[en],
        });
        idx++;
      }
    }
  }

  return artworks;
}

// 미리 생성된 데이터 (싱글톤)
let _cached: SampleArtwork[] | null = null;
export function getSampleArtworks(): SampleArtwork[] {
  if (!_cached) _cached = generateAllSampleArtworks();
  return _cached;
}

// 케이스코드로 필터
export function getArtworksByCase(caseCode: string): SampleArtwork[] {
  return getSampleArtworks().filter(a => a.caseCode === caseCode);
}

// 오행으로 필터
export function getArtworksByElement(element: OhaengElement): SampleArtwork[] {
  return getSampleArtworks().filter(a => a.element === element);
}

// 추천 케이스코드 순서대로 작품 가져오기
export function getRecommendedArtworks(caseCodes: string[], limit = 10): SampleArtwork[] {
  const all = getSampleArtworks();
  const result: SampleArtwork[] = [];
  for (const code of caseCodes) {
    const match = all.find(a => a.caseCode === code);
    if (match) result.push(match);
    if (result.length >= limit) break;
  }
  return result;
}
