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

// ── 주별 해석 ───────────────────────────────────────
export interface PillarMeaning {
  label: string;
  lifeStage: string;
  relationship: string;
  ageRange: string;
  description: string;
}

export function getPillarMeanings(result: SajuResult): PillarMeaning[] {
  return [
    {
      label: '연주 (年柱)',
      lifeStage: '초년운',
      relationship: '조상·조부모',
      ageRange: '1~15세',
      description: `${result.yeonju.cheongan}${result.yeonju.jiji}(${result.yeonju.ohaeng}/${result.yeonju.jijiOhaeng}) — 가문의 기운과 초년기 환경을 나타냅니다. 사회적 이미지와 외부에서 보이는 모습을 의미합니다.`,
    },
    {
      label: '월주 (月柱)',
      lifeStage: '청년운',
      relationship: '부모·형제',
      ageRange: '16~30세',
      description: `${result.wolju.cheongan}${result.wolju.jiji}(${result.wolju.ohaeng}/${result.wolju.jijiOhaeng}) — 부모와의 관계, 성장 환경, 학업과 사회 진출 시기를 나타냅니다. 격국의 기반이 됩니다.`,
    },
    {
      label: '일주 (日柱)',
      lifeStage: '장년운',
      relationship: '나·배우자',
      ageRange: '31~45세',
      description: `${result.ilju.cheongan}${result.ilju.jiji}(${result.ilju.ohaeng}/${result.ilju.jijiOhaeng}) — 나 자신의 본질과 배우자 관계를 나타냅니다. 일간은 사주 해석의 중심입니다.`,
    },
    {
      label: '시주 (時柱)',
      lifeStage: '말년운',
      relationship: '자식·후배',
      ageRange: '46세~',
      description: `${result.siju.cheongan}${result.siju.jiji}(${result.siju.ohaeng}/${result.siju.jijiOhaeng}) — 자녀운과 말년의 삶, 그리고 미래의 결실을 나타냅니다.`,
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
