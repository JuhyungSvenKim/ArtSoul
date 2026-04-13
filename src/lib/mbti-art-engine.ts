/**
 * MBTI → 125 케이스코드 매칭 엔진
 * v2: 차원별 강도(퍼센트)를 반영한 정밀 매칭
 */
import type { OhaengElement, EnergyLevel, StyleCode } from "./case-code/types";
import type { MbtiStrengths } from "@/stores/onboarding";

// ── MBTI 4축 분해 ─────────────────────────────
type MbtiAxis = { EI: "E" | "I"; SN: "S" | "N"; TF: "T" | "F"; JP: "J" | "P" };

function parseMbti(mbti: string): MbtiAxis | null {
  if (!mbti || mbti.length !== 4) return null;
  const m = mbti.toUpperCase();
  return { EI: m[0] as "E" | "I", SN: m[1] as "S" | "N", TF: m[2] as "T" | "F", JP: m[3] as "J" | "P" };
}

// ── 축별 선호도 매핑 (1~5 점수) ──────────────
// 에너지 선호 [energy 1~5]
const ENERGY_PREF: Record<string, number[]> = {
  E: [1, 2, 5, 4, 3], I: [5, 4, 1, 2, 3],
  J: [2, 5, 3, 1, 4], P: [4, 1, 2, 5, 3],
};
// 스타일 선호 [S1~S5]
const STYLE_PREF: Record<string, number[]> = {
  S: [5, 3, 4, 1, 2], N: [2, 3, 1, 4, 5],
  T: [4, 1, 5, 2, 3], F: [2, 5, 3, 4, 1],
};
// 오행(색감) 선호
const ELEMENT_PREF: Record<string, Record<OhaengElement, number>> = {
  E: { W: 3, F: 5, E: 2, M: 1, A: 4 },
  I: { W: 4, F: 1, E: 3, M: 5, A: 5 },
  S: { W: 3, F: 2, E: 5, M: 4, A: 1 },
  N: { W: 5, F: 4, E: 1, M: 2, A: 5 },
  T: { W: 2, F: 1, E: 3, M: 5, A: 4 },
  F: { W: 5, F: 4, E: 4, M: 1, A: 3 },
  J: { W: 2, F: 2, E: 5, M: 4, A: 1 },
  P: { W: 4, F: 5, E: 1, M: 2, A: 5 },
};

// ── 매칭 결과 ─────────────────────────────────
export interface MbtiMatchResult {
  caseCode: string;
  element: OhaengElement;
  energy: EnergyLevel;
  style: StyleCode;
  score: number;
  reason: string;
}

// ── 강도 기반 가중 점수 계산 ──────────────────
function weightedScore(
  prefA: number, prefB: number,
  strengthA: number, strengthB: number,
): number {
  const wA = strengthA / 100;
  const wB = strengthB / 100;
  return prefA * wA + prefB * wB;
}

// 극단도 보너스: 축이 극단일수록 점수 차이가 벌어짐
// E 95% → 극단도 0.9 (=|95-50|/50), E 52% → 극단도 0.04
function polarityBonus(strengths: MbtiStrengths): number {
  const dims = [
    Math.abs(strengths.E - 50),
    Math.abs(strengths.S - 50),
    Math.abs(strengths.T - 50),
    Math.abs(strengths.J - 50),
  ];
  // 평균 극단도 0~50 → 0~1로 정규화
  const avg = dims.reduce((a, b) => a + b, 0) / dims.length;
  return avg / 50; // 0 = 전부 50:50, 1 = 전부 극단
}

// ── 메인 매칭 엔진 ───────────────────────────
export function matchMbtiToArt(mbti: string, strengths?: MbtiStrengths | null): {
  top: MbtiMatchResult[];
  mbtiLabel: string;
  personality: string;
  artVibe: string;
} {
  const axis = parseMbti(mbti);
  if (!axis) return { top: [], mbtiLabel: mbti, personality: "", artVibe: "" };

  // 강도가 없으면 기본 이진값 사용 (직접 선택 시)
  const s = strengths || {
    E: axis.EI === "E" ? 75 : 25, I: axis.EI === "I" ? 75 : 25,
    S: axis.SN === "S" ? 75 : 25, N: axis.SN === "N" ? 75 : 25,
    T: axis.TF === "T" ? 75 : 25, F: axis.TF === "F" ? 75 : 25,
    J: axis.JP === "J" ? 75 : 25, P: axis.JP === "P" ? 75 : 25,
  };

  const elements: OhaengElement[] = ["W", "F", "E", "M", "A"];
  const energies: EnergyLevel[] = [1, 2, 3, 4, 5];
  const styles: StyleCode[] = ["S1", "S2", "S3", "S4", "S5"];

  const results: MbtiMatchResult[] = [];
  const polarity = polarityBonus(s); // 0~1, 극단일수록 높음

  for (const el of elements) {
    for (const en of energies) {
      for (const st of styles) {
        // 에너지 점수 (E/I 강도 + J/P 강도 가중)
        const eiEnergy = weightedScore(
          ENERGY_PREF.E[en - 1], ENERGY_PREF.I[en - 1], s.E, s.I
        );
        const jpEnergy = weightedScore(
          ENERGY_PREF.J[en - 1], ENERGY_PREF.P[en - 1], s.J, s.P
        );
        const energyScore = (eiEnergy + jpEnergy) / 2;

        // 스타일 점수 (S/N 강도 + T/F 강도 가중)
        const stIdx = parseInt(st[1]) - 1;
        const snStyle = weightedScore(
          STYLE_PREF.S[stIdx], STYLE_PREF.N[stIdx], s.S, s.N
        );
        const tfStyle = weightedScore(
          STYLE_PREF.T[stIdx], STYLE_PREF.F[stIdx], s.T, s.F
        );
        const styleScore = (snStyle + tfStyle) / 2;

        // 오행 점수 (4축 각각 강도 가중)
        const elScoreEI = weightedScore(ELEMENT_PREF.E[el], ELEMENT_PREF.I[el], s.E, s.I);
        const elScoreSN = weightedScore(ELEMENT_PREF.S[el], ELEMENT_PREF.N[el], s.S, s.N);
        const elScoreTF = weightedScore(ELEMENT_PREF.T[el], ELEMENT_PREF.F[el], s.T, s.F);
        const elScoreJP = weightedScore(ELEMENT_PREF.J[el], ELEMENT_PREF.P[el], s.J, s.P);
        const elScore = (elScoreEI + elScoreSN + elScoreTF + elScoreJP) / 4;

        const rawTotal = (energyScore * 30 + styleScore * 30 + elScore * 40) / 5;

        // 극단도 보너스: 극단일수록 점수 범위가 넓어짐 (30~99)
        // 50:50이면 범위 좁음 (50~75), 극단이면 범위 넓음 (30~99)
        const minScore = Math.round(50 - polarity * 20); // 50→30
        const maxScore = Math.round(75 + polarity * 24); // 75→99
        const normalized = minScore + (rawTotal - 10) / 20 * (maxScore - minScore);
        const finalScore = Math.min(99, Math.max(minScore, Math.round(normalized)));

        results.push({
          caseCode: `${el}${en}-${st}`,
          element: el, energy: en, style: st,
          score: finalScore,
          reason: "",
        });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  const top = results.slice(0, 20);

  // MBTI별 성격 + 아트 바이브
  const personalities: Record<string, { personality: string; artVibe: string }> = {
    INTJ: { personality: "전략가. 독립적이고 분석적, 완벽주의 성향", artVibe: "미니멀하고 구조적인 작품, 차가운 톤의 추상화가 잘 맞아" },
    INTP: { personality: "논리학자. 호기심 많고 창의적, 이론가 기질", artVibe: "실험적이고 개념적인 작품, 복잡한 패턴이나 기하학적 구성" },
    ENTJ: { personality: "통솔자. 리더십 강하고 야심차고 결단력 있음", artVibe: "대담하고 임팩트 있는 작품, 강렬한 색감의 대형 작품" },
    ENTP: { personality: "변론가. 재치 있고 도전적, 아이디어 넘침", artVibe: "파격적이고 유니크한 작품, 팝아트나 컨템포러리" },
    INFJ: { personality: "옹호자. 이상주의적이고 통찰력 있고 공감 능력", artVibe: "깊이 있고 서사적인 작품, 동양적 여백이나 몽환적 분위기" },
    INFP: { personality: "중재자. 감성적이고 창의적, 이상을 추구", artVibe: "감성적이고 따뜻한 작품, 자연 풍경이나 부드러운 색감" },
    ENFJ: { personality: "선도자. 카리스마 있고 영감을 주는 타입", artVibe: "사람을 끌어당기는 작품, 따뜻하면서 존재감 있는 그림" },
    ENFP: { personality: "활동가. 열정적이고 사교적, 가능성을 봄", artVibe: "밝고 자유로운 작품, 다채로운 색감이나 역동적 구도" },
    ISTJ: { personality: "현실주의자. 책임감 강하고 신뢰할 수 있음", artVibe: "클래식하고 품위 있는 작품, 사실주의나 전통 회화" },
    ISFJ: { personality: "수호자. 따뜻하고 헌신적, 안정 추구", artVibe: "포근하고 편안한 작품, 자연 소재나 따뜻한 톤" },
    ESTJ: { personality: "경영자. 조직적이고 실용적, 규칙 중시", artVibe: "정돈되고 격식 있는 작품, 고전 미술이나 깔끔한 인테리어 아트" },
    ESFJ: { personality: "영사. 사교적이고 배려심 많고 조화 중시", artVibe: "대중적이고 어디에나 잘 어울리는 작품, 꽃이나 풍경" },
    ISTP: { personality: "장인. 관찰력 있고 실용적, 손재주 좋음", artVibe: "질감이 느껴지는 작품, 미니멀하면서 기술적으로 뛰어난 것" },
    ISFP: { personality: "모험가. 예술적이고 감각적, 자유로운 영혼", artVibe: "감각적이고 아름다운 작품, 색채가 풍부한 자연 주제" },
    ESTP: { personality: "사업가. 대담하고 활동적, 현실 감각", artVibe: "강렬하고 눈에 띄는 작품, 팝아트나 대담한 그래픽" },
    ESFP: { personality: "연예인. 즉흥적이고 에너지 넘치고 재미 추구", artVibe: "화려하고 신나는 작품, 비비드한 색감이나 팝 스타일" },
  };

  const info = personalities[mbti.toUpperCase()] || { personality: mbti, artVibe: "" };
  return { top, mbtiLabel: mbti.toUpperCase(), ...info };
}
