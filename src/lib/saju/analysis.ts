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
  비견: "나랑 똑같은 에너지를 가진 존재. 쉽게 말하면 '내편이지만 라이벌'인 느낌. 혼자 해야 직성이 풀리는 타입",
  겁재: "승부욕 MAX. 이기고 싶은 마음이 강한데, 돈도 크게 벌고 크게 씀. 통장 잔고가 롤러코스터",
  식신: "타고난 맛집러+크리에이터. 먹는 복 있고, 뭔가 만들어내는 재주가 있음. 여유로운 에너지",
  상관: "입이 거침없고 창의적. 기존 룰? 나한테 안 맞으면 부숴버리는 타입. 예술가 기질 폭발",
  편재: "큰돈이 왔다갔다하는 기운. 사업 수완이 있고 이성한테 적극적. 인생이 다이내믹함",
  정재: "월급 꼬박꼬박 모으는 타입. 성실하고 현실적이고 돈 관리 잘함. 안정감의 대명사",
  편관: "카리스마+압박이 동시에 오는 기운. 리더십은 있는데 스트레스도 세게 옴. 센 에너지",
  정관: "조직에서 인정받는 타입. 규칙 잘 지키고 신뢰받고 명예가 따라옴. 반듯한 에너지",
  편인: "남들이랑 다른 뇌구조. 일반적인 사고방식? 그런 거 없음. 독학으로 뭐든 파는 타입",
  정인: "공부 좋아하고 엄마 복 있는 기운. 자격증, 문서, 학위 — 이쪽으로 복이 옴",
};

// 오행 조합 해석 (MZ 버전)
const OHAENG_COMBO: Record<string, string> = {
  "목목": "나무+나무라 성장 에너지가 넘치는데, 고집도 나무급으로 셈",
  "목화": "나무가 불을 살리듯, 재능이 자연스럽게 빛나는 좋은 조합",
  "목토": "나무가 흙을 뚫고 나가려는 기운. 추진력은 있는데 안정감이랑 부딪힐 수 있음",
  "목금": "쇠가 나무를 다듬듯, 외부 압력이 나를 단련시키는 구조. 힘들지만 강해짐",
  "목수": "물이 나무를 키우듯, 지혜가 성장을 도와주는 흐름. 배우면 배울수록 커짐",
  "화화": "불+불이라 열정은 폭발인데, 가끔 과열되서 본인이 타버릴 수 있음",
  "화토": "불이 흙을 만들듯, 열정이 현실 성과로 이어지는 좋은 구조",
  "화금": "불이 쇠를 녹이듯, 감정이랑 이성이 충돌하기 쉬움. 내면 갈등 주의",
  "화수": "물이 불을 끄듯, 감정이 억눌리거나 하고 싶은 걸 참게 되는 기운",
  "토토": "흙+흙이라 안정감은 최고인데, 변화에 좀 느릴 수 있음. 편한 게 좋은 타입",
  "토금": "흙에서 금이 나오듯, 안정된 상태에서 결단력이 나옴. 묵직한 추진력",
  "토수": "흙이 물을 막듯, 현실이랑 이상 사이에서 갈등이 생기기 쉬움",
  "금금": "쇠+쇠라 의지가 강철급인데, 융통성은 좀 부족할 수 있음",
  "금수": "쇠가 물을 낳듯, 결단력이 지혜로 이어지는 좋은 흐름",
  "수수": "물+물이라 생각이 정말 많음. 감성은 깊은데 결정장애 올 수 있음",
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
    if (list.length === 0) return '';
    const hasGuiin = list.some(n => n.includes('귀인'));
    const hasSal = list.some(n => n.includes('살'));
    if (hasGuiin && hasSal) return ` 여기에 ${list.join(', ')}이 같이 붙어있어서, 기회랑 시련이 동시에 오는 자리야.`;
    if (hasGuiin) return ` ${list.join(', ')}이 붙어있어서, 이 시기에 도움 줄 사람이 나타날 확률 높음.`;
    return ` ${list.join(', ')}이 붙어있어서, 에너지가 꽤 강하게 작동하는 자리야.`;
  };

  const sipsungDesc = (name: string) => SIPSUNG_MEANING[name] || name || "알 수 없음";

  return [
    {
      label: '연주 (年柱)',
      lifeStage: '초년운',
      relationship: '조상·조부모',
      ageRange: '1~15세',
      description: `어린 시절 에너지를 보여주는 자리야.${sipsung.yeonjuCg ? ` 위에 ${sipsung.yeonjuCg}(${(sipsungDesc(sipsung.yeonjuCg) || "").split('.')[0]})이 떠 있고,` : ""} ${getComboDesc(yeonju.ohaeng, yeonju.jijiOhaeng)}. 어릴 때 집안 분위기나 성장 환경이 이 기운으로 깔려 있었다고 보면 돼.${sinsalText('연주')}`,
    },
    {
      label: '월주 (月柱)',
      lifeStage: '청년운',
      relationship: '부모·형제',
      ageRange: '16~30세',
      description: `사회에 나가기 시작하는 시기의 기운이야.${sipsung.woljuCg ? ` ${sipsung.woljuCg}(${(sipsungDesc(sipsung.woljuCg) || "").split('.')[0]})이 깔려 있고,` : ""} ${getComboDesc(wolju.ohaeng, wolju.jijiOhaeng)}. 첫 직장이나 진로를 정할 때 이 에너지가 크게 영향을 줘.${sinsalText('월주')}`,
    },
    {
      label: '일주 (日柱)',
      lifeStage: '장년운',
      relationship: '나·배우자',
      ageRange: '31~45세',
      description: `여기가 사주의 메인이야. 일간 ${ilju.cheonganKor}(${ilju.ohaeng})이 바로 "나" 자신이고,${sipsung.iljuJj ? ` 아래 깔린 ${sipsung.iljuJj}(${(sipsungDesc(sipsung.iljuJj) || "").split('.')[0]})이 배우자나 내면의 기질을 보여줘.` : ""} ${getComboDesc(ilju.ohaeng, ilju.jijiOhaeng)}.${sinsalText('일주')}`,
    },
    {
      label: '시주 (時柱)',
      lifeStage: '말년운',
      relationship: '자식·후배',
      ageRange: '46세~',
      description: `인생 후반부의 에너지야.${sipsung.sijuCg ? ` ${sipsung.sijuCg}(${(sipsungDesc(sipsung.sijuCg) || "").split('.')[0]})이 떠 있고,` : ""} ${getComboDesc(siju.ohaeng, siju.jijiOhaeng)}. 말년의 방향, 자녀 복, 인생 마무리가 어떤 느낌인지가 여기에 담겨 있어.${sinsalText('시주')}`,
    },
  ];
}

// ── 사주 총평 ───────────────────────────────────────
export function getSajuSummary(result: SajuResult): string {
  const balance = getOhaengBalance(result);
  const { dominant, lacking } = getOhaengAnalysis(balance, '');
  const yongsin = getYongsin(balance, result.ilju.ohaeng);

  const ilganDesc: Record<string, string> = {
    목: '나무 같은 사람이야. 성장하고 뻗어나가려는 기질이 강하고, 창의적이고 정 많은 타입.',
    화: '불 같은 사람이야. 열정적이고 활발하고, 표현력이 좋아서 사람들 앞에 서는 걸 잘해.',
    토: '땅 같은 사람이야. 믿음직하고 안정적이고, 사람들 사이에서 중심을 잡아주는 역할.',
    금: '쇠 같은 사람이야. 한번 정하면 안 바꾸고, 의리 있고 선이 분명한 타입.',
    수: '물 같은 사람이야. 머리가 좋고 유연하고, 상황 파악이 빠른 타입. 생각이 깊음.',
  };

  const gyeokgukName = result.gyeokguk.name;
  const sinsalCount = result.sinsal.length;
  const domStr = dominant.join(', ');
  const lackStr = lacking.length > 0 ? lacking.join(', ') : '없음';

  return `일간 ${result.ilju.cheongan}(${result.ilju.cheonganKor}·${result.ilju.ohaeng}) — ${ilganDesc[result.ilju.ohaeng] || ''}\n\n` +
    `오행을 보면 ${domStr}이(가) 강하고 ${lackStr}이(가) 부족해. ` +
    `그래서 용신은 ${yongsin.element}인데, 쉽게 말하면 ${yongsin.element} 기운을 보충하면 운이 풀리는 구조야.\n\n` +
    `격국은 "${gyeokgukName}" — ${result.gyeokguk.description}\n\n` +
    `신살은 총 ${sinsalCount}개가 잡혀. 자세한 건 아래에서 확인해봐.`;
}
