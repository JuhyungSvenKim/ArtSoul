/**
 * 사주 결과 기반 추가 분석 (오행 밸런스, 용신, 행운 아이템, 주별 해석)
 */
import type { SajuResult, Ganji } from './types'

// ── 오행 밸런스 ─────────────────────────────────────
export interface OhaengBalance {
  목: number;
  화: number;
  토: number;
  금: number;
  수: number;
}

export function getOhaengBalance(result: SajuResult): OhaengBalance {
  const count: OhaengBalance = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const pillars = [result.yeonju, result.wolju, result.ilju, result.siju];

  for (const p of pillars) {
    if (p.ohaeng in count) count[p.ohaeng as keyof OhaengBalance]++;
    if (p.jijiOhaeng in count) count[p.jijiOhaeng as keyof OhaengBalance]++;
  }

  return count;
}

export function getOhaengAnalysis(balance: OhaengBalance, ilgan: string): {
  dominant: string[];
  lacking: string[];
  description: string;
} {
  const entries = Object.entries(balance) as [string, number][];
  const max = Math.max(...entries.map(([, v]) => v));
  const min = Math.min(...entries.map(([, v]) => v));

  const dominant = entries.filter(([, v]) => v === max && v > 0).map(([k]) => k);
  const lacking = entries.filter(([, v]) => v === min && v <= 1).map(([k]) => k);

  const domStr = dominant.join(', ');
  const lackStr = lacking.length > 0 ? lacking.join(', ') : '없음';

  const description = `일간 ${ilgan} 기준, ${domStr}이(가) 강하고 ${lackStr}이(가) 부족합니다.`;

  return { dominant, lacking, description };
}

// ── 용신 (用神) ─────────────────────────────────────
export interface Yongsin {
  element: string;
  reason: string;
}

const OHAENG_SANG: Record<string, string> = {
  목: '수', 화: '목', 토: '화', 금: '토', 수: '금',
};

const OHAENG_GEUK: Record<string, string> = {
  목: '금', 화: '수', 토: '목', 금: '화', 수: '토',
};

export function getYongsin(balance: OhaengBalance, ilganOhaeng: string): Yongsin {
  const entries = Object.entries(balance) as [string, number][];
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const myCount = balance[ilganOhaeng as keyof OhaengBalance] || 0;

  // 일간이 약하면 → 일간을 생하는 오행이 용신
  // 일간이 강하면 → 일간을 극하는 오행이 용신
  if (myCount <= total / 5) {
    const helping = OHAENG_SANG[ilganOhaeng];
    return {
      element: helping,
      reason: `${ilganOhaeng}이 약하므로 ${ilganOhaeng}을 생하는 ${helping}이 용신입니다`,
    };
  } else {
    // 가장 부족한 오행 찾기
    const sorted = entries.sort((a, b) => a[1] - b[1]);
    const weakest = sorted[0][0];
    return {
      element: weakest,
      reason: `팔자에 ${weakest}이(가) 가장 부족하여 ${weakest}이 용신입니다`,
    };
  }
}

// ── 행운 아이템 + 예술 추천 ─────────────────────────
export interface LuckyItems {
  colors: string[];
  colorHexes: string[];
  direction: string;
  season: string;
  number: string;
  artStyles: { label: string; emoji: string }[];
  artSubjects: { label: string; emoji: string }[];
  artMoods: { label: string; emoji: string }[];
}

const OHAENG_LUCKY: Record<string, LuckyItems> = {
  목: {
    colors: ['초록', '청색', '연두'],
    colorHexes: ['#22C55E', '#3B82F6', '#84CC16'],
    direction: '동쪽',
    season: '봄',
    number: '3, 8',
    artStyles: [
      { label: '수묵화', emoji: '🖌️' },
      { label: '자연주의', emoji: '🌿' },
      { label: '인상주의', emoji: '🎨' },
    ],
    artSubjects: [
      { label: '숲·나무', emoji: '🌲' },
      { label: '봄꽃 정물', emoji: '🌸' },
      { label: '대나무·난초', emoji: '🎋' },
    ],
    artMoods: [
      { label: '성장', emoji: '🌱' },
      { label: '생명력', emoji: '✨' },
      { label: '자유', emoji: '🕊️' },
    ],
  },
  화: {
    colors: ['빨강', '주황', '보라'],
    colorHexes: ['#EF4444', '#F97316', '#A855F7'],
    direction: '남쪽',
    season: '여름',
    number: '2, 7',
    artStyles: [
      { label: '표현주의', emoji: '🔥' },
      { label: '팝아트', emoji: '💥' },
      { label: '추상화', emoji: '🌀' },
    ],
    artSubjects: [
      { label: '노을·석양', emoji: '🌅' },
      { label: '강렬한 추상', emoji: '💫' },
      { label: '인물·초상', emoji: '👤' },
    ],
    artMoods: [
      { label: '열정', emoji: '❤️‍🔥' },
      { label: '강렬함', emoji: '⚡' },
      { label: '에너지', emoji: '🌟' },
    ],
  },
  토: {
    colors: ['노랑', '갈색', '베이지'],
    colorHexes: ['#EAB308', '#92400E', '#D2B48C'],
    direction: '중앙',
    season: '환절기',
    number: '5, 10',
    artStyles: [
      { label: '정물화', emoji: '🏺' },
      { label: '민화', emoji: '🎎' },
      { label: '도예 작품', emoji: '🫖' },
    ],
    artSubjects: [
      { label: '전통 도자기', emoji: '🍶' },
      { label: '들판·수확', emoji: '🌾' },
      { label: '옛 마을 풍경', emoji: '🏡' },
    ],
    artMoods: [
      { label: '안정', emoji: '🧘' },
      { label: '따뜻함', emoji: '☕' },
      { label: '전통', emoji: '📜' },
    ],
  },
  금: {
    colors: ['흰색', '은색', '금색'],
    colorHexes: ['#F5F5F5', '#C0C0C0', '#FFD700'],
    direction: '서쪽',
    season: '가을',
    number: '4, 9',
    artStyles: [
      { label: '미니멀리즘', emoji: '◻️' },
      { label: '건축 사진', emoji: '🏛️' },
      { label: '금속 조각', emoji: '⚙️' },
    ],
    artSubjects: [
      { label: '가을 단풍', emoji: '🍂' },
      { label: '기하학 구성', emoji: '📐' },
      { label: '보석·메탈', emoji: '💎' },
    ],
    artMoods: [
      { label: '절제', emoji: '🪷' },
      { label: '정밀', emoji: '🔍' },
      { label: '고요', emoji: '🌙' },
    ],
  },
  수: {
    colors: ['검정', '남색', '파랑'],
    colorHexes: ['#1F2937', '#1E3A5F', '#3B82F6'],
    direction: '북쪽',
    season: '겨울',
    number: '1, 6',
    artStyles: [
      { label: '수채화', emoji: '💧' },
      { label: '몽환적 추상', emoji: '🌌' },
      { label: '수묵담채', emoji: '🖋️' },
    ],
    artSubjects: [
      { label: '바다·호수', emoji: '🌊' },
      { label: '비 오는 거리', emoji: '🌧️' },
      { label: '겨울 설경', emoji: '❄️' },
    ],
    artMoods: [
      { label: '몽환', emoji: '🔮' },
      { label: '유동', emoji: '🌀' },
      { label: '깊이', emoji: '🕳️' },
    ],
  },
};

export function getLuckyItems(yongsinElement: string): LuckyItems {
  return OHAENG_LUCKY[yongsinElement] || OHAENG_LUCKY['토'];
}

// ── 주별 해석 (실제 간지+십성+신살 기반) ──────────────
export interface PillarMeaning {
  label: string;
  lifeStage: string;
  relationship: string;
  ageRange: string;
  description: string;
}

// 십성별 의미
const SIPSUNG_MEANING: Record<string, string> = {
  비견: "나와 같은 기운, 경쟁자이자 동료. 독립심과 자존심이 강하고 형제·동료와의 관계가 핵심",
  겁재: "나를 빼앗는 기운, 승부욕과 도전. 투기적 성향이 있고 재물이 들어와도 쉽게 나감",
  식신: "내가 낳는 기운, 재능과 여유. 먹고 즐기는 복이 있고 표현력과 창의성이 뛰어남",
  상관: "내가 쏟아내는 기운, 날카로운 말과 예술적 재능. 기존 질서를 깨는 힘, 관과 충돌",
  편재: "내가 다스리는 재물, 큰돈과 투자. 사업수완과 이성관계에 적극적, 돈이 크게 왔다감",
  정재: "꾸준히 모으는 재물, 안정적 수입. 성실하고 검소하며 현실적, 월급형 재물",
  편관: "나를 공격하는 힘, 권력과 통제. 카리스마와 리더십이 있으나 스트레스와 압박도 강함",
  정관: "나를 바르게 세우는 힘, 명예와 책임. 조직에서 인정받고 규칙을 잘 따르며 신뢰받음",
  편인: "남다른 학습, 특수 재능. 일반적이지 않은 사고방식, 연구·기술·영성에 강함",
  정인: "학문과 어머니 복, 자격과 문서. 공부를 좋아하고 논리적이며 보호받는 기운",
};

// 오행 조합 해석
const OHAENG_COMBO: Record<string, string> = {
  "목목": "목이 겹쳐 성장 에너지가 강하지만 고집도 셈",
  "목화": "목생화, 재능이 자연스럽게 표출되는 조합",
  "목토": "목극토, 추진력은 있으나 안정감과 충돌할 수 있음",
  "목금": "금극목, 외부 압력과 단련을 통해 성장하는 구조",
  "목수": "수생목, 지혜가 성장을 도와주는 좋은 흐름",
  "화화": "화가 겹쳐 열정은 넘치지만 과열 주의",
  "화토": "화생토, 열정이 현실적 결실로 이어지는 조합",
  "화금": "화극금, 감정과 이성이 충돌하기 쉬움",
  "화수": "수극화, 감정이 억눌리거나 내면 갈등이 생김",
  "토토": "토가 겹쳐 안정은 좋으나 변화에 둔할 수 있음",
  "토금": "토생금, 안정 속에서 결단력이 나오는 구조",
  "토수": "토극수, 현실과 이상 사이의 갈등",
  "금금": "금이 겹쳐 의지가 강하나 융통성이 부족할 수 있음",
  "금수": "금생수, 결단이 지혜로 이어지는 좋은 흐름",
  "수수": "수가 겹쳐 생각이 많고 감성이 깊으나 우유부단할 수 있음",
};

function getComboDesc(oh1: string, oh2: string): string {
  return OHAENG_COMBO[oh1 + oh2] || OHAENG_COMBO[oh2 + oh1] || `${oh1}과 ${oh2}의 조합`;
}

export function getPillarMeanings(result: SajuResult): PillarMeaning[] {
  const { yeonju, wolju, ilju, siju, sipsung, sinsal } = result;

  // 주별 신살 모으기
  const sinsalByPos: Record<string, string[]> = { 연주: [], 월주: [], 일주: [], 시주: [] };
  (sinsal || []).forEach((s: any) => { if (sinsalByPos[s.position]) sinsalByPos[s.position].push(s.name); });

  const sinsalText = (pos: string) => {
    const list = sinsalByPos[pos];
    return list.length > 0 ? ` 신살로 ${list.join(', ')}이(가) 자리해 ${list.some(n => n.includes('귀인')) ? '도움을 받는 기운이 있습니다' : '특별한 에너지가 작동합니다'}.` : '';
  };

  // 십성 해석 텍스트
  const sipsungDesc = (name: string) => SIPSUNG_MEANING[name] || name;

  return [
    {
      label: '연주 (年柱)',
      lifeStage: '초년운',
      relationship: '조상·조부모',
      ageRange: '1~15세',
      description: `${yeonju.cheonganKor}${yeonju.jijiKor}(${yeonju.ohaeng}/${yeonju.jijiOhaeng}). 천간 십성은 ${sipsung.yeonjuCg}으로, ${sipsungDesc(sipsung.yeonjuCg).split('.')[0]}. ${getComboDesc(yeonju.ohaeng, yeonju.jijiOhaeng)}. 어린 시절 가정 환경에 이 기운이 반영됩니다.${sinsalText('연주')}`,
    },
    {
      label: '월주 (月柱)',
      lifeStage: '청년운',
      relationship: '부모·형제',
      ageRange: '16~30세',
      description: `${wolju.cheonganKor}${wolju.jijiKor}(${wolju.ohaeng}/${wolju.jijiOhaeng}). 천간 십성은 ${sipsung.woljuCg}으로, ${sipsungDesc(sipsung.woljuCg).split('.')[0]}. ${getComboDesc(wolju.ohaeng, wolju.jijiOhaeng)}. 사회 진출기의 환경과 직업 방향에 큰 영향을 줍니다.${sinsalText('월주')}`,
    },
    {
      label: '일주 (日柱)',
      lifeStage: '장년운',
      relationship: '나·배우자',
      ageRange: '31~45세',
      description: `${ilju.cheonganKor}${ilju.jijiKor}(${ilju.ohaeng}/${ilju.jijiOhaeng}). 일간 ${ilju.cheonganKor}(${ilju.ohaeng})이 사주의 주인이고, 지지 십성은 ${sipsung.iljuJj}로 ${sipsungDesc(sipsung.iljuJj).split('.')[0]}. ${getComboDesc(ilju.ohaeng, ilju.jijiOhaeng)}. 배우자와의 관계, 본인의 핵심 성격이 여기서 드러납니다.${sinsalText('일주')}`,
    },
    {
      label: '시주 (時柱)',
      lifeStage: '말년운',
      relationship: '자식·후배',
      ageRange: '46세~',
      description: `${siju.cheonganKor}${siju.jijiKor}(${siju.ohaeng}/${siju.jijiOhaeng}). 천간 십성은 ${sipsung.sijuCg}으로, ${sipsungDesc(sipsung.sijuCg).split('.')[0]}. ${getComboDesc(siju.ohaeng, siju.jijiOhaeng)}. 말년의 방향성과 자녀복, 인생 후반의 결실이 담겨 있습니다.${sinsalText('시주')}`,
    },
  ];
}

// ── 사주 총평 ───────────────────────────────────────
export function getSajuSummary(result: SajuResult): string {
  const balance = getOhaengBalance(result);
  const { dominant, lacking } = getOhaengAnalysis(balance, '');
  const yongsin = getYongsin(balance, result.ilju.ohaeng);

  const ilganDesc: Record<string, string> = {
    목: '나무처럼 성장하고 뻗어나가려는 기질이 강합니다. 창의적이고 진취적이며 인정이 많습니다.',
    화: '불처럼 열정적이고 활발합니다. 예의 바르고 표현력이 뛰어나며 리더십이 있습니다.',
    토: '대지처럼 신뢰감 있고 안정적입니다. 포용력이 크고 중재 능력이 뛰어납니다.',
    금: '쇠처럼 단단하고 결단력이 있습니다. 의리가 강하고 정의감이 넘칩니다.',
    수: '물처럼 지혜롭고 유연합니다. 총명하고 적응력이 뛰어나며 깊은 사고력을 가졌습니다.',
  };

  const gyeokgukName = result.gyeokguk.name;
  const sinsalCount = result.sinsal.length;
  const domStr = dominant.join(', ');
  const lackStr = lacking.length > 0 ? lacking.join(', ') : '없음';

  return `일간 ${result.ilju.cheongan}(${result.ilju.cheonganKor}/${result.ilju.ohaeng}) — ${ilganDesc[result.ilju.ohaeng] || ''}\n\n` +
    `오행 구성에서 ${domStr}이(가) 강하고 ${lackStr}이(가) 부족합니다. ` +
    `용신은 ${yongsin.element}으로, ${yongsin.element} 기운을 보충하면 운이 트입니다.\n\n` +
    `격국은 "${gyeokgukName}"이며, ${result.gyeokguk.description}\n\n` +
    `총 ${sinsalCount}개의 신살이 발견되었습니다.`;
}
