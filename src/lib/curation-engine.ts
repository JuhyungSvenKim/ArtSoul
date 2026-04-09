/**
 * 큐레이팅 엔진 — 작품의 사주 매칭 설명 + 큐레이터 해설 생성
 */
import type { OhaengElement, EnergyLevel, StyleCode } from "@/lib/case-code/types";
import { ELEMENT_MAP, ENERGY_MAP, STYLE_MAP } from "@/lib/case-code/types";

interface CurationInput {
  // 작품 정보
  element: OhaengElement;
  energy: EnergyLevel;
  style: StyleCode;
  title: string;
  // 사주 정보 (없으면 일반 설명)
  userYongsin?: string;
  userDayOh?: string;
  userDayStrength?: string;
}

interface CurationResult {
  matchScore: number;
  matchSummary: string;           // "나와의 매칭" 한줄
  curatorNote: string;            // 큐레이터 해설 (2~3단락)
  whyForMe: string;               // 왜 내 사주에 좋은지
  spaceAdvice: string;            // 어디에 두면 좋은지
  moodKeywords: string[];         // 분위기 키워드
  techniqueNote: string;          // 기법/질감 설명
}

// 오행별 큐레이터 노트 요소
const ELEMENT_NOTES: Record<OhaengElement, { color: string; texture: string; emotion: string; season: string }> = {
  W: { color: "초록과 청색이 자연스럽게 어우러지는", texture: "나뭇결처럼 유기적이고 따뜻한 질감", emotion: "생명력과 성장의 에너지", season: "봄의 기운" },
  F: { color: "붉은 빛과 주황이 강렬하게 번지는", texture: "두텁고 역동적인 붓터치", emotion: "열정과 존재감의 에너지", season: "한여름의 뜨거움" },
  E: { color: "황토와 베이지가 따뜻하게 감싸는", texture: "도자기처럼 묵직하고 안정감 있는 표면", emotion: "포용과 안정의 에너지", season: "환절기의 넉넉함" },
  M: { color: "은빛과 흰색이 차갑게 빛나는", texture: "매끈하고 정밀한, 금속적 질감", emotion: "절제와 정밀의 에너지", season: "가을 서리의 맑음" },
  A: { color: "깊은 남색과 파랑이 출렁이는", texture: "물결처럼 유동적이고 부드러운 층위", emotion: "지혜와 유연함의 에너지", season: "겨울 호수의 깊이" },
};

const ENERGY_NOTES: Record<EnergyLevel, { composition: string; feeling: string }> = {
  1: { composition: "넓은 여백이 말하는, 고요한 구도", feeling: "바라보는 것만으로 마음이 고요해지는" },
  2: { composition: "좌우 대칭과 균형이 만드는 안정감", feeling: "질서와 조화가 공간에 평화를 가져다주는" },
  3: { composition: "사선과 대비가 만드는 역동적 흐름", feeling: "에너지가 솟구치며 행동력을 자극하는" },
  4: { composition: "유기적 곡선이 자연스럽게 이어지는", feeling: "감정의 흐름을 따라가며 공감을 이끄는" },
  5: { composition: "빈틈없이 채워진 밀도 높은 구성", feeling: "깊이 들여다볼수록 새로운 것이 보이는" },
};

const STYLE_NOTES: Record<StyleCode, { technique: string; vibe: string }> = {
  S1: { technique: "고전적 유화 기법, 세밀한 명암과 층위 있는 색채", vibe: "시간이 쌓인 듯한 품격과 격조" },
  S2: { technique: "먹의 농담과 여백, 절제된 붓질", vibe: "동양적 사유와 정적인 아름다움" },
  S3: { technique: "기하학적 형태, 미니멀한 색면 구성", vibe: "군더더기 없는 현대적 세련미" },
  S4: { technique: "대담한 색면, 그래픽적 구성, 팝적 에너지", vibe: "강렬한 존재감과 트렌디한 감각" },
  S5: { technique: "혼합 매체, 텍스처 레이어링, 수공예적 디테일", vibe: "소장 가치가 높은 유니크한 아우라" },
};

export function curate(input: CurationInput): CurationResult {
  const el = ELEMENT_MAP[input.element];
  const en = ENERGY_MAP[input.energy];
  const st = STYLE_MAP[input.style];
  const elNote = ELEMENT_NOTES[input.element];
  const enNote = ENERGY_NOTES[input.energy];
  const stNote = STYLE_NOTES[input.style];

  // 매칭 점수 (사주 있을 때)
  let matchScore = 70;
  let matchSummary = "";
  let whyForMe = "";

  if (input.userYongsin && input.userDayOh) {
    const yongsinElement = Object.entries(ELEMENT_MAP).find(([, v]) => v.ohaeng === input.userYongsin)?.[0] as OhaengElement | undefined;

    if (yongsinElement === input.element) {
      matchScore = 90 + Math.floor(Math.random() * 8);
      matchSummary = `용신(${input.userYongsin}) 오행과 정확히 일치하는 작품입니다. 당신의 사주에 가장 필요한 기운이 이 그림에 담겨 있어요.`;
      whyForMe = `당신의 일간은 ${input.userDayOh}이고 ${input.userDayStrength === "강" ? "기운이 넘치는 편" : input.userDayStrength === "약" ? "기운을 보충해야 하는 편" : "균형이 잘 잡힌 편"}입니다. 용신인 ${input.userYongsin}의 기운이 이 작품 전체에 흐르고 있어서, 공간에 두기만 해도 부족한 오행이 자연스럽게 채워집니다. 마치 매일 좋은 보약을 한 첩씩 복용하는 것과 같은 효과예요.`;
    } else {
      matchScore = 72 + Math.floor(Math.random() * 15);
      matchSummary = `${el?.labelKor}의 에너지가 당신의 사주에 새로운 자극을 줄 수 있는 작품입니다.`;
      whyForMe = `이 작품의 ${el?.labelKor} 기운은 당신의 ${input.userDayOh} 일간과 만나 독특한 시너지를 만듭니다. 직접적인 보완은 아니지만, ${enNote.feeling} 에너지가 일상에 변화를 가져다줄 거예요.`;
    }
  } else {
    matchSummary = `${el?.labelKor}의 기운과 ${en?.labelKor} 에너지가 조화로운 작품입니다.`;
    whyForMe = "사주 분석을 먼저 해보시면, 이 작품이 당신에게 왜 좋은지 구체적으로 알 수 있어요.";
  }

  // 큐레이터 해설
  const curatorNote = `${elNote.color} 색채가 첫눈에 시선을 사로잡습니다. ${stNote.technique}으로 완성된 이 작품은 ${elNote.emotion}를 담고 있습니다.

${enNote.composition}. ${enNote.feeling} 이 작품은 바라보는 시간이 길어질수록 다른 이야기를 들려줍니다. ${elNote.texture}이 화면 전체에 살아 숨쉬며, ${stNote.vibe}를 공간에 불어넣습니다.

${elNote.season}을 머금은 이 작품은 어떤 공간에 놓이든 그 공간의 무게와 온도를 바꿔놓습니다.`;

  // 공간 조언
  const spaceMap: Record<EnergyLevel, string> = {
    1: "침실이나 서재처럼 고요한 공간에 두면, 하루의 피로가 자연스럽게 녹아내립니다.",
    2: "거실 중앙 벽면에 걸면, 공간 전체에 안정감과 조화가 퍼집니다.",
    3: "사무실이나 작업 공간에 두면, 추진력과 집중력이 올라갑니다.",
    4: "카페나 소셜 공간에 어울리며, 사람들 사이의 대화를 부드럽게 이어줍니다.",
    5: "로비나 갤러리 벽면에 걸면, 공간의 깊이가 한 차원 달라집니다.",
  };

  const moodMap: Record<OhaengElement, string[]> = {
    W: ["성장", "자유", "생명력", "봄"],
    F: ["열정", "강렬", "에너지", "빛"],
    E: ["안정", "따뜻", "포근", "전통"],
    M: ["절제", "고요", "정밀", "세련"],
    A: ["몽환", "깊이", "유동", "신비"],
  };

  return {
    matchScore,
    matchSummary,
    curatorNote,
    whyForMe,
    spaceAdvice: spaceMap[input.energy],
    moodKeywords: moodMap[input.element] || [],
    techniqueNote: `${stNote.technique}. ${elNote.texture}.`,
  };
}

// 렌탈 가격 산식: 월 렌탈 = 판매가의 2.5%
export function calculateRentalPrice(purchasePrice: number): number {
  return Math.round(purchasePrice * 0.025 / 1000) * 1000; // 1000원 단위 반올림
}
