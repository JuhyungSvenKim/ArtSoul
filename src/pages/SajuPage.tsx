import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import TabBar from "@/components/TabBar";
import { useOnboardingStore } from "@/stores/onboarding";
import { saveCache, loadCache, getExpiryDate, getRemainingText } from "@/lib/cache";
import { getSaju, sajuToAIPrompt } from "@/lib/saju";
import type { SajuResult, Ganji, DaeunItem, SinsalItem, RelationItem } from "@/lib/saju";
import { getOhaengBalance, getOhaengAnalysis, getYongsin, getLuckyItems, getPillarMeanings, getSajuSummary } from "@/lib/saju/analysis";
import { analyzeYongsin } from "@/lib/saju/yongsin";
import { matchSajuToCases, getTopBaseCases } from "@/lib/case-code";
import { ELEMENT_MAP, ENERGY_MAP, STYLE_MAP } from "@/lib/case-code/types";
import CaseCodeArt from "@/components/CaseCodeArt";
import { getRecommendedArtworks } from "@/data/sample-artworks";
import { getCoinBalance, deductCoins, saveFortune, getLatestFortune } from "@/services/coins";
import { supabase } from "@/lib/supabase";
import { callGemini } from "@/lib/gemini";

// ── 오행 색상 매핑 ──────────────────────────────────
const OHAENG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  목: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/40" },
  화: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/40" },
  토: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/40" },
  금: { bg: "bg-gray-400/20", text: "text-gray-300", border: "border-gray-400/40" },
  수: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/40" },
};

const getOhaengStyle = (ohaeng: string) =>
  OHAENG_COLORS[ohaeng] || { bg: "bg-surface", text: "text-foreground", border: "border-border" };

// ── 4주 기둥 컴포넌트 (균일 높이) ───────────────────
function PillarCard({ label, ganji, sipsungCg, sipsungJj, twelveJj }: {
  label: string;
  ganji: Ganji;
  sipsungCg?: string;
  sipsungJj: string;
  twelveJj: string;
}) {
  const cgStyle = getOhaengStyle(ganji.ohaeng);
  const jjStyle = getOhaengStyle(ganji.jijiOhaeng);

  return (
    <div className="flex-1 text-center min-w-0">
      <p className="text-[10px] text-muted-foreground mb-2 truncate">{label}</p>
      {/* 천간 - 고정 높이 */}
      <div className={`rounded-lg ${cgStyle.bg} ${cgStyle.border} border p-2 mb-1 h-[72px] flex flex-col items-center justify-center`}>
        <p className={`text-2xl font-bold ${cgStyle.text} leading-none`}>{ganji.cheongan}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{ganji.cheonganKor} · {ganji.ohaeng}</p>
        <p className="text-[10px] text-primary leading-none mt-0.5">{sipsungCg || '\u00A0'}</p>
      </div>
      {/* 지지 - 고정 높이 */}
      <div className={`rounded-lg ${jjStyle.bg} ${jjStyle.border} border p-2 h-[88px] flex flex-col items-center justify-center`}>
        <p className={`text-2xl font-bold ${jjStyle.text} leading-none`}>{ganji.jiji}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{ganji.jijiKor} · {ganji.jijiOhaeng}</p>
        <p className="text-[10px] text-primary leading-none mt-0.5">{sipsungJj}</p>
        <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{twelveJj}</p>
      </div>
    </div>
  );
}

// ── 대운 타임라인 + 시기별 해석 ──────────────────────
const OHAENG_RELATION: Record<string, Record<string, string>> = {
  목: { 목: "비겁(동류)", 화: "식상(표현)", 토: "재성(재물)", 금: "관성(압력)", 수: "인성(지원)" },
  화: { 화: "비겁(동류)", 토: "식상(표현)", 금: "재성(재물)", 수: "관성(압력)", 목: "인성(지원)" },
  토: { 토: "비겁(동류)", 금: "식상(표현)", 수: "재성(재물)", 목: "관성(압력)", 화: "인성(지원)" },
  금: { 금: "비겁(동류)", 수: "식상(표현)", 목: "재성(재물)", 화: "관성(압력)", 토: "인성(지원)" },
  수: { 수: "비겁(동류)", 목: "식상(표현)", 화: "재성(재물)", 토: "관성(압력)", 금: "인성(지원)" },
};

const DAEUN_VIBES: Record<string, { good: string; warn: string }> = {
  "비겁(동류)": { good: "자신감이 올라가고 독립심이 강해지는 시기", warn: "고집이 세질 수 있으니 유연함 필요" },
  "식상(표현)": { good: "창의력, 표현력이 폭발하는 시기. 새로운 시도에 유리", warn: "말실수, 오버가 많아질 수 있으니 조절" },
  "재성(재물)": { good: "돈이 보이기 시작하는 시기. 수입 루트 다양화 찬스", warn: "과소비, 투자 실패 주의. 계약서 꼼꼼히" },
  "관성(압력)": { good: "사회적 인정, 승진, 책임감이 커지는 시기", warn: "스트레스, 건강, 법적 문제에 주의. 쉬는 것도 전략" },
  "인성(지원)": { good: "공부, 자격증, 내면 성장에 최적인 시기", warn: "게을러지거나 의존적이 될 수 있으니 행동력 유지" },
};

function DaeunTimeline({ daeun, startAge, birthYear, dayOh, yongsinOh, dayStrength, sinsal }: {
  daeun: DaeunItem[]; startAge: number; birthYear: number;
  dayOh: string; yongsinOh: string; dayStrength: string; sinsal: SinsalItem[];
}) {
  // 현재 나이 (한국 나이 = 현재연도 - 출생연도 + 1)
  const koreanAge = new Date().getFullYear() - birthYear + 1;
  const currentDaeunIdx = daeun.findIndex(d => koreanAge >= d.startAge && koreanAge <= d.endAge);

  // 신살 이름 리스트
  const majorSals = sinsal.filter(s => s.effect === 'negative').map(s => s.name);
  const majorGuiins = sinsal.filter(s => s.effect === 'positive').map(s => s.name);

  return (
    <div className="space-y-5">
      {/* 타임라인 카드 */}
      <div className="overflow-x-auto -mx-1 px-1 scrollbar-hide">
        <div className="flex gap-2 pb-2" style={{ minWidth: daeun.length * 72 }}>
          {daeun.map((d, i) => {
            const style = getOhaengStyle(d.ganji.ohaeng);
            const isCurrent = i === currentDaeunIdx;
            return (
              <div key={i} className="flex flex-col items-center shrink-0 w-16">
                <div className={`w-full rounded-lg ${style.bg} ${style.border} border p-2 text-center transition-all ${isCurrent ? "ring-2 ring-primary shadow-lg" : ""}`}>
                  <p className={`text-base font-bold ${style.text}`}>{d.ganji.cheongan}{d.ganji.jiji}</p>
                  <p className="text-[10px] text-muted-foreground">{d.ganji.cheonganKor}{d.ganji.jijiKor}</p>
                </div>
                <p className={`text-[10px] mt-1 ${isCurrent ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                  {d.startAge}~{d.endAge}세
                </p>
                {isCurrent && <span className="text-[9px] text-primary">지금 {koreanAge}세</span>}
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">대운 시작: {startAge.toFixed(1)}세</p>
      </div>

      {/* 현재 대운 강조 */}
      {currentDaeunIdx >= 0 && (() => {
        const curr = daeun[currentDaeunIdx];
        const rel = OHAENG_RELATION[dayOh]?.[curr.ganji.ohaeng] || "기타";
        const vibe = DAEUN_VIBES[rel];
        const isYongsinMatch = curr.ganji.ohaeng === yongsinOh || curr.ganji.jijiOhaeng === yongsinOh;
        return (
          <div className="bg-card border border-primary/30 rounded-xl p-4 glow-mystical">
            <p className="text-xs text-primary font-semibold mb-2">
              지금 내 대운: {curr.ganji.cheonganKor}{curr.ganji.jijiKor} ({curr.startAge}~{curr.endAge}세)
            </p>
            <div className="space-y-2">
              <p className="text-xs text-foreground/90 leading-relaxed">
                {curr.ganji.ohaeng} 기운이 들어오는 시기야. {dayOh} 일간 입장에서 이건 <span className="text-primary font-medium">{rel}</span>의 에너지.
                {isYongsinMatch
                  ? ` 게다가 용신 ${yongsinOh}과 일치해서 지금이 꽤 좋은 타이밍이야. 이 시기를 잘 활용하면 큰 성과가 가능함.`
                  : ` 용신 ${yongsinOh}과는 다른 에너지지만, 이걸 어떻게 쓰느냐에 따라 달라져.`
                }
              </p>
              {vibe && (
                <>
                  <p className="text-xs text-green-400/90">{vibe.good}</p>
                  <p className="text-xs text-red-400/80">{vibe.warn}</p>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* 시기별 대운 해석 */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <p className="text-xs text-foreground font-medium mb-3">대운 시기별 흐름</p>
        <div className="space-y-4">
          {daeun.map((d, i) => {
            const rel = OHAENG_RELATION[dayOh]?.[d.ganji.ohaeng] || "기타";
            const vibe = DAEUN_VIBES[rel];
            const isCurrent = i === currentDaeunIdx;
            const isYongsin = d.ganji.ohaeng === yongsinOh || d.ganji.jijiOhaeng === yongsinOh;
            const style = getOhaengStyle(d.ganji.ohaeng);

            // 강약에 따른 해석
            let strengthNote = "";
            if (dayStrength === "강" && (rel === "관성(압력)" || rel === "재성(재물)")) {
              strengthNote = "일간이 강하니 이 시기의 압력을 오히려 성과로 전환 가능";
            } else if (dayStrength === "약" && (rel === "인성(지원)" || rel === "비겁(동류)")) {
              strengthNote = "일간이 약한 편이라 이 시기의 지원 에너지가 딱 맞아. 회복기";
            } else if (dayStrength === "약" && rel === "관성(압력)") {
              strengthNote = "일간이 약한데 압력이 오니 무리하지 말 것. 건강 관리 최우선";
            }

            return (
              <div key={i} className={`flex gap-3 ${isCurrent ? "bg-primary/5 -mx-2 px-2 py-2 rounded-lg border border-primary/20" : ""}`}>
                <div className="shrink-0 w-14 text-center">
                  <span className={`text-sm font-bold ${style.text}`}>{d.ganji.cheonganKor}{d.ganji.jijiKor}</span>
                  <p className={`text-[10px] ${isCurrent ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                    {d.startAge}~{d.endAge}세
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] text-muted-foreground">{d.ganji.ohaeng}→{dayOh}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>{rel}</span>
                    {isYongsin && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">용신 시기</span>}
                    {isCurrent && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">NOW</span>}
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    {vibe?.good || `${d.ganji.ohaeng}의 기운이 흘러들어오는 시기`}
                  </p>
                  {strengthNote && <p className="text-[10px] text-primary/80 mt-0.5">{strengthNote}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 전체 대운 조화 (용신/신살 기준) */}
      <div className="bg-card border border-primary/20 rounded-xl p-4">
        <p className="text-xs text-primary font-medium mb-2">대운 전체 흐름 (용신 {yongsinOh} 기준)</p>
        <p className="text-xs text-foreground/80 leading-[1.8]">
          {(() => {
            const yongsinDaeuns = daeun.filter(d => d.ganji.ohaeng === yongsinOh || d.ganji.jijiOhaeng === yongsinOh);
            const pressureDaeuns = daeun.filter(d => {
              const rel = OHAENG_RELATION[dayOh]?.[d.ganji.ohaeng];
              return rel === "관성(압력)";
            });

            let note = `${dayOh} 일간(${dayStrength})의 대운을 보면, `;
            if (yongsinDaeuns.length > 0) {
              note += `용신 ${yongsinOh}이 들어오는 시기는 ${yongsinDaeuns.map(d => `${d.startAge}~${d.endAge}세`).join(', ')}이야. 이때가 인생의 황금기가 될 가능성이 높아. `;
            } else {
              note += `대운에서 용신 ${yongsinOh}이 직접 오는 시기는 없지만, 세운(매년의 운)에서 보충될 수 있어. `;
            }
            if (pressureDaeuns.length > 0) {
              note += `${pressureDaeuns.map(d => `${d.startAge}~${d.endAge}세`).join(', ')}는 관성(압력)이 오는 시기라 도전과 성장이 동시에 찾아올 거야. `;
            }
            if (majorSals.length > 0) {
              note += `신살 중 ${majorSals.slice(0, 3).join(', ')}이(가) 있어서 대운 전환기마다 에너지 변동이 클 수 있는데, `;
            }
            if (majorGuiins.length > 0) {
              note += `${majorGuiins.slice(0, 2).join(', ')} 귀인이 있으니 위기 때마다 도움의 손길이 들어올 거야. `;
            }
            note += `핵심은 용신 ${yongsinOh}의 에너지를 의식적으로 살리면서, 각 대운의 흐름에 올라타는 것`;
            return note;
          })()}
        </p>
      </div>
    </div>
  );
}

// ── 신살 — 개별 해설 + 주별 종합 + 용신 기반 조화 해석 ──
const SINSAL_DETAIL: Record<string, { vibe: string; tip: string }> = {
  '천을귀인': { vibe: '위기에 빠지면 어디선가 도움이 뚝 떨어지는 운. 사주계의 보험 같은 존재', tip: '큰 결정 앞에서 직감을 믿어도 되는 사람' },
  '태극귀인': { vibe: '생각이 깊고 철학적인 뇌. 남들이 "왜?" 할 때 혼자 이미 답을 찾고 있음', tip: '명상, 독서, 혼자만의 시간이 에너지 충전 루틴' },
  '문창귀인': { vibe: '글, 말, 시험, 문서에 강한 별. 펜 들면 뭔가 나오는 타입', tip: '블로그, 글쓰기, 기획서 — 문서로 승부하면 이김' },
  '천희성': { vibe: '기쁜 일이 잘 따라다니는 별. 결혼, 출산, 좋은 소식의 시그널', tip: '좋은 소식이 올 타이밍엔 욕심내도 됨' },
  '천덕귀인': { vibe: '하늘이 덕을 내려준 운. 큰 사고도 가볍게 넘어가는 보호막', tip: '남을 도우면 그 복이 배로 돌아옴' },
  '월덕귀인': { vibe: '사회적으로 인정받기 쉬운 운. 직장, 사업에서 신뢰를 얻는 별', tip: '공적인 자리에서 능력 발휘하기 좋음' },
  '괴강살': { vibe: '카리스마 폭발. 리더십 강하고 뒷끝 없는데, 주변이 좀 무서워할 수 있음', tip: '부드럽게 말하는 연습만 하면 최강 조합' },
  '백호살': { vibe: '에너지가 셈. 사고, 수술, 격렬한 변화의 시그널이지만 돌파력도 여기서 나옴', tip: '위험한 스포츠나 무리한 야근은 자제' },
  '효신살': { vibe: '내면의 의심과 경계심. 사람을 쉽게 안 믿는데, 그래서 사기를 안 당하기도 함', tip: '의심이 과하면 기회를 놓침. 70%만 믿고 시작해봐' },
  '홍염살': { vibe: '이성에게 끌리는 매력이 있는 별. 본인은 모르는데 주변에서 느낌', tip: '매력을 자각하면 인간관계가 훨씬 수월해짐' },
  '과숙살': { vibe: '내면이 조숙하고 고독한 별. 혼자 있는 시간이 필요한 영혼', tip: '외로움을 약점으로 보지 마. 깊이의 원천임' },
  '현침살': { vibe: '말과 글이 바늘처럼 날카로운 별. 핵심을 콕 찌르는 재능', tip: '좋은 방향으로 쓰면 평론가, 작가, 컨설턴트 기질' },
  '천라지망': { vibe: '한번 빠지면 빠져나오기 어려운 심리적 그물. 집착, 얽힘 주의', tip: '관계든 일이든 "이건 아니다" 싶으면 빨리 손절하는 연습' },
  '도화살': { vibe: '매력, 인기, 예술성의 별. 사람을 끌어당기는 힘이 있음', tip: '이 에너지를 연애가 아닌 창작으로 쓰면 대박' },
  '역마살': { vibe: '가만히 못 있는 별. 이동, 여행, 변화의 에너지가 강함', tip: '한 곳에 오래 있으면 답답. 환경 변화가 약임' },
  '화개살': { vibe: '예술, 종교, 학문의 별. 남들과 다른 세계를 가진 사람', tip: '영적 감수성이 높아서 창작이나 상담 쪽에 재능' },
  '양인살': { vibe: '결단력과 독립심이 강한 별. 칼 같은 판단력의 소유자', tip: '이 에너지가 너무 세면 주변이 힘들 수 있으니 조절 필요' },
};

function SinsalList({ sinsal, yongsinOh, dayOh }: { sinsal: SinsalItem[]; yongsinOh: string; dayOh: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (sinsal.length === 0) return <p className="text-sm text-muted-foreground">해당 신살 없음</p>;

  const groups: Record<string, SinsalItem[]> = { '시주': [], '일주': [], '월주': [], '연주': [] };
  sinsal.forEach(s => { if (groups[s.position]) groups[s.position].push(s); });

  const effectStyle = (e: string) =>
    e === 'positive' ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : e === 'negative' ? 'bg-red-500/20 text-red-400 border-red-500/30'
      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';

  const positionMeaning: Record<string, string> = {
    '시주': '말년·자녀·결과',
    '일주': '본인·배우자·현재',
    '월주': '사회·직업·중년',
    '연주': '조상·어린시절·외부',
  };

  const positives = sinsal.filter(s => s.effect === 'positive');
  const negatives = sinsal.filter(s => s.effect === 'negative');

  // 주별 종합 해석
  const pillarNotes: Record<string, string> = {};
  for (const [pos, items] of Object.entries(groups)) {
    if (items.length === 0) continue;
    const posLabel = positionMeaning[pos];
    const names = items.map(s => s.name);
    const posPositives = items.filter(s => s.effect === 'positive');
    const posNegatives = items.filter(s => s.effect === 'negative');

    if (posPositives.length > 0 && posNegatives.length > 0) {
      pillarNotes[pos] = `${posLabel} 영역에 귀인(${posPositives.map(s => s.name).join(', ')})과 살(${posNegatives.map(s => s.name).join(', ')})이 공존. 기회와 시련이 같이 오는 구간이라 판단력이 중요`;
    } else if (posPositives.length > 0) {
      pillarNotes[pos] = `${posLabel} 영역이 귀인(${names.join(', ')})으로 보호받는 구간. 이쪽에서 행운이 들어옴`;
    } else if (posNegatives.length > 0) {
      pillarNotes[pos] = `${posLabel} 영역에 살(${names.join(', ')})이 집중. 에너지가 강한 구간이라 잘 다루면 오히려 무기가 됨`;
    } else {
      pillarNotes[pos] = `${posLabel} 영역에 ${names.join(', ')}이(가) 위치. 이 방면에 독특한 감각이 있음`;
    }
  }

  // 전체 조화 해석
  const posCount = positives.length;
  const negCount = negatives.length;
  const totalCount = sinsal.length;
  let harmonyNote = '';
  if (posCount > negCount) {
    harmonyNote = `전체 ${totalCount}개 신살 중 귀인이 ${posCount}개로 우세. ${dayOh} 일간의 기본 복이 두텁고, 용신 ${yongsinOh}의 기운이 귀인들과 시너지를 만들어 위기마다 반등하는 힘이 있는 구조야. 네가 ${yongsinOh}의 에너지를 의식적으로 살리면 운이 더 잘 풀림`;
  } else if (negCount > posCount) {
    harmonyNote = `살이 ${negCount}개로 에너지가 상당히 강한 사주. 근데 이건 "나쁘다"가 아니라 "세다"는 뜻이야. ${negatives.map(s => s.name).join(', ')}은(는) 용신 ${yongsinOh}의 기운으로 중화하면 오히려 추진력, 카리스마, 돌파력이 됨. ${dayOh} 일간이 ${yongsinOh}를 잘 활용하면 살의 날카로움이 무기로 바뀌는 구조. 단, 과로·과욕·과격한 판단은 살이 역으로 작용할 수 있으니 밸런스가 핵심`;
  } else {
    harmonyNote = `귀인과 살이 ${posCount}:${negCount}으로 균형. 기회와 시련이 교대로 오는 리듬이 있는 사주야. ${dayOh} 일간이 용신 ${yongsinOh}를 중심에 두면, 귀인은 더 강해지고 살은 에너지원으로 전환됨`;
  }

  // 주 안에서의 의미 생성 (신살 + 위치 조합)
  const getSinsalInContext = (s: SinsalItem) => {
    const pos = s.position;
    const posLabel = positionMeaning[pos];
    const detail = SINSAL_DETAIL[s.name];
    const siblings = groups[pos] || [];
    const hasBoth = siblings.some(x => x.effect === 'positive') && siblings.some(x => x.effect === 'negative');

    // 이 주에서 이 신살이 뭘 뜻하는지
    let contextNote = '';
    if (s.effect === 'positive') {
      contextNote = `${pos}(${posLabel})에 있으니, ${posLabel.split('·')[0]} 쪽에서 이 귀인의 힘이 작동해. `;
      if (pos === '시주') contextNote += '말년이 편안하거나 자녀 복이 있을 수 있음';
      else if (pos === '일주') contextNote += '본인한테 직접 붙어있는 복이라 체감이 강함';
      else if (pos === '월주') contextNote += '직장이나 사회생활에서 도움을 받기 쉬운 위치';
      else if (pos === '연주') contextNote += '어릴 때부터 타고난 운이거나, 외부에서 복이 들어옴';
    } else {
      contextNote = `${pos}(${posLabel})에 있으니, ${posLabel.split('·')[0]} 쪽에서 이 에너지가 나타나기 쉬워. `;
      if (pos === '시주') contextNote += '말년이나 결과물에서 변동이 생길 수 있음';
      else if (pos === '일주') contextNote += '본인 성격이나 배우자 관계에 직접 영향';
      else if (pos === '월주') contextNote += '직장, 사회생활에서 마찰이나 긴장이 생기기 쉬운 위치';
      else if (pos === '연주') contextNote += '어린 시절 경험이나 외부 환경에서의 영향';
    }

    // 같은 주에 좋은살+나쁜살 공존 시 보완 해석
    let complementNote = '';
    if (hasBoth) {
      const posGood = siblings.filter(x => x.effect === 'positive').map(x => x.name);
      const posBad = siblings.filter(x => x.effect === 'negative').map(x => x.name);
      complementNote = `같은 ${pos}에 ${posGood.join('·')}과(와) ${posBad.join('·')}이(가) 함께 있어서 서로 보완됨. 살의 날카로움을 귀인이 감싸주는 구조라 위기가 와도 반등이 빠른 편`;
    }

    return { contextNote, complementNote };
  };

  // 주별 보완 해석 (귀인+살 공존하는 주만)
  const pillarComplement: { pos: string; note: string }[] = [];
  for (const [pos, items] of Object.entries(groups)) {
    if (items.length === 0) continue;
    const posGood = items.filter(x => x.effect === 'positive');
    const posBad = items.filter(x => x.effect === 'negative');
    const posLabel = positionMeaning[pos];
    if (posGood.length > 0 && posBad.length > 0) {
      pillarComplement.push({ pos, note: `${pos}(${posLabel})에 ${posGood.map(x => x.name).join('·')}과(와) ${posBad.map(x => x.name).join('·')}이(가) 같이 있어서 서로 보완됨. 살의 날카로움을 귀인이 감싸주는 구조라, 이 영역에서 위기가 와도 반등이 빠른 편` });
    } else if (posGood.length > 0) {
      pillarComplement.push({ pos, note: `${pos}(${posLabel})는 ${posGood.map(x => x.name).join('·')}으로 보호받는 구간. 이쪽에서 행운이 들어옴` });
    } else if (posBad.length > 0) {
      pillarComplement.push({ pos, note: `${pos}(${posLabel})에 ${posBad.map(x => x.name).join('·')}이(가) 집중. 에너지가 강한 구간이라 잘 다루면 무기가 됨` });
    }
  }

  return (
    <div className="space-y-5">
      {/* 1) 4주별 배치 — 클릭하면 그 자리에서 vibe + 위치의미 */}
      <div className="grid grid-cols-4 gap-2">
        {['시주', '일주', '월주', '연주'].map(pos => (
          <div key={pos}>
            <p className="text-[10px] text-muted-foreground text-center mb-1">{pos}</p>
            <p className="text-[9px] text-muted-foreground/50 text-center mb-1.5">{positionMeaning[pos]}</p>
            <div className="bg-surface border border-border rounded-lg p-1.5 min-h-[60px] space-y-1">
              {groups[pos].length === 0 ? (
                <p className="text-[10px] text-muted-foreground/30 text-center py-2">—</p>
              ) : (
                groups[pos].map((s, i) => {
                  const key = `${pos}-${s.name}`;
                  const isOpen = expanded === key;
                  const detail = SINSAL_DETAIL[s.name];
                  const { contextNote } = getSinsalInContext(s);
                  return (
                    <div key={i}>
                      <button onClick={() => setExpanded(isOpen ? null : key)}
                        className={`w-full text-[10px] px-1.5 py-1 rounded text-center font-medium border transition-all ${effectStyle(s.effect)} ${isOpen ? "ring-1 ring-primary/30" : ""}`}>
                        {s.name}
                      </button>
                      {isOpen && (
                        <div className="mt-1.5 p-2.5 bg-card border border-border rounded-lg animate-fade-in text-left space-y-1">
                          <p className="text-[11px] text-foreground/90 leading-relaxed">{detail?.vibe || s.description}</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">{contextNote}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 2) 주별 신살 해석 (세로 배치, 가독성 높게) */}
      <div className="space-y-3">
        {pillarComplement.map(({ pos, note }) => (
          <div key={pos} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-foreground">{pos}</span>
              <span className="text-xs text-muted-foreground">{positionMeaning[pos]}</span>
            </div>
            <p className="text-sm text-foreground/80 leading-[1.8]">{note}</p>
          </div>
        ))}
      </div>

      {/* 3) 전체 신살 조화 — 용신/음양 기준 */}
      <div className="bg-card border border-primary/20 rounded-xl p-4">
        <p className="text-sm text-primary font-medium mb-2">신살 종합 해석 (용신 {yongsinOh} 기준)</p>
        <p className="text-sm text-foreground/80 leading-[1.8]">{harmonyNote}</p>
      </div>
    </div>
  );
}

// ── 합충형파해 ──────────────────────────────────────
function RelationsList({ relations }: { relations: RelationItem[] }) {
  if (relations.length === 0) return <p className="text-sm text-muted-foreground">해당 관계 없음</p>;
  const typeColors: Record<string, string> = {
    합: "bg-green-500/20 text-green-400",
    충: "bg-red-500/20 text-red-400",
    형: "bg-orange-500/20 text-orange-400",
    파: "bg-yellow-500/20 text-yellow-400",
    해: "bg-purple-500/20 text-purple-400",
    방합: "bg-blue-500/20 text-blue-400",
    삼합: "bg-cyan-500/20 text-cyan-400",
  };
  return (
    <div className="flex flex-wrap gap-2">
      {relations.map((r, i) => (
        <div key={i} className={`px-3 py-1.5 rounded-full text-xs font-medium ${typeColors[r.type] || "bg-surface text-foreground"}`}>
          {r.detail} ({r.positions.join("-")})
        </div>
      ))}
    </div>
  );
}

// ── AI 해석 (코인 동적 — 어드민 설정) ────────────────
import { getCoinPricing } from "@/lib/coin-pricing";

function AIInterpretation({ prompt, userId }: { prompt: string; userId: string | null }) {
  const pricing = getCoinPricing();
  const AI_INTERPRETATION_COST = pricing.aiInterpretation;
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 캐시에서 로드
  useEffect(() => {
    const cached = loadCache('ai_interpretation');
    if (cached) {
      setInterpretation(cached.text);
      setExpiresAt(cached.expiresAt);
    }
  }, []);

  const fetchInterpretation = async () => {
    if (!userId) {
      setError('온보딩을 먼저 완료해주세요');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await deductCoins(userId, AI_INTERPRETATION_COST);

      const fullPrompt = `아래 사주팔자를 깊이 있게 해석해주세요. 소설가처럼 술술 읽히게, 하지만 전문성은 확실하게 써주세요.

첫 문장부터 이 사람의 본질을 꿰뚫는 한 줄로 시작하세요.
예시: "이 사주는 겉으로 보면 차분한데, 속은 용광로입니다."

각 단락의 첫 문장이 소제목 역할을 하게 쓰세요.
비유를 적극 활용하고, 읽는 사람이 '어, 이거 나인데?' 하게 만드세요.
단점도 위로와 함께 쓰되 솔직하게, 대운은 이야기처럼 써주세요.

다음 내용을 빠짐없이, 이 순서대로:
일간 성격 (3~4단락), 오행 밸런스, 격국과 십성, 신살 해석, 공망, 합충형파해, 재물운, 직업운 (구체 직종 5개+), 연애운, 건강, 대운 흐름 (각 대운별 이야기체), 종합 조언 (힘나는 한 문장으로 마무리)

${prompt}`;

      const text = await callGemini(fullPrompt);
      const expiry = getExpiryDate('ai_interpretation');

      setInterpretation(text);
      setExpiresAt(expiry.toISOString());
      saveCache('ai_interpretation', text, expiry);
    } catch (e: any) {
      setError(e.message || "AI 해석 요청 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (!confirm("AI 해석을 초기화하시겠습니까?\n다시 받으려면 코인이 필요합니다.")) return;
    setInterpretation(null);
    setExpiresAt(null);
    // 캐시 삭제
    try { localStorage.removeItem('artsoul-cache-ai_interpretation'); } catch {}
  };

  return (
    <div>
      {!interpretation && !loading && (
        <div className="space-y-2">
          <button onClick={fetchInterpretation} className="w-full py-3.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-all">
            🔮 AI 사주 해석 받기 ({AI_INTERPRETATION_COST} 코인)
          </button>
          <p className="text-[10px] text-muted-foreground text-center">웹소설처럼 술술 읽히는 깊이 있는 사주 해석</p>
        </div>
      )}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">당신의 사주를 깊이 읽고 있습니다...</p>
          <p className="text-[10px] text-muted-foreground/60">30초~1분 정도 소요됩니다</p>
        </div>
      )}
      {error && <div className="rounded-lg bg-red-500/20 text-red-400 px-3 py-2 text-xs font-medium">{error}</div>}
      {interpretation && (
        <div className="bg-surface border border-border rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-base">🔮</span>
              <p className="text-sm font-semibold text-primary">AI 사주 해석</p>
            </div>
            <div className="flex items-center gap-2">
              {expiresAt && (
                <span className="text-[10px] text-muted-foreground">{getRemainingText(expiresAt)}</span>
              )}
              <button onClick={handleReset}
                className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors px-2 py-1 rounded border border-transparent hover:border-red-400/20">
                초기화
              </button>
            </div>
          </div>
          <div className="text-sm text-foreground/85 leading-[1.85] whitespace-pre-wrap">{interpretation}</div>
        </div>
      )}
    </div>
  );
}

// ── 섹션 ────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <div className="w-1 h-4 bg-primary rounded-full" />
        {title}
      </h2>
      {children}
    </section>
  );
}

// ── 운세 타입 정의 (비용은 동적) ────────────────────
function getFortuneTypes() {
  const p = getCoinPricing();
  return [
  { key: 'today' as const, label: '오늘의 운세', cost: p.fortuneToday, icon: '☀️', settingsKey: 'fortune_today_prompt', promptExtra: `오늘 하루의 운세를 써줘.

톤: 아침에 카톡으로 받으면 기분 좋아지는 친구 느낌. 가볍지만 찔리는 한마디.
구조: 오늘의 키워드 한 줄 → 전체 운세 (3~4줄) → 재물 한줄팁 → 연애 한줄팁 → 건강 한줄팁 → 오늘의 행동 조언
예시: "오늘은 입을 한 번만 더 닫으면 좋은 일이 생기는 날 ㅋㅋ"
반말+존댓말 믹스 OK. 재미있게. 근데 내용은 정확하게.` },

  { key: 'week' as const, label: '금주의 운세', cost: 3, icon: '📅', settingsKey: 'fortune_week_prompt', promptExtra: `이번 주 운세를 써줘.

톤: 한 주 미리보기 브리핑. 요일별 핵심만 콕.
구조: 이번 주 핵심 키워드 → 월~금 각 요일별 한줄 (구체적 행동 포함) → 주말 운세 → 총평 한 줄
예시: "수요일, 돈 관련 제안 오면 24시간만 묵혀. 목요일에 답 보임."
각 요일이 드라마 예고편처럼 느껴지게.` },

  { key: 'month' as const, label: '월간 운세', cost: 5, icon: '🗓️', settingsKey: 'fortune_month_prompt', promptExtra: `이번 달 운세를 써줘.

톤: 월간 매거진 칼럼인데 친구가 써준 느낌.
구조: 이번 달 테마 한 줄 → 1주차/2주차/3주차/4주차 각 3~4줄 → 재물운 → 연애운 → 건강운 → 핵심 한 줄
각 주차를 시즌제 드라마 "1화, 2화" 느낌으로.
예시: "2주차는 씨앗 심는 타임. 결과 당장 보려 하지 마."` },

  { key: 'year' as const, label: '올해 운세', cost: 10, icon: '🎯', settingsKey: 'fortune_year_prompt', promptExtra: `올해 전체 운세를 써줘.

톤: 올해가 내 인생에서 어떤 시즌인지 큰 그림. 단편소설처럼.
구조: 올해 한 줄 정의 → 대운과의 관계 → 1분기/2분기/3분기/4분기 각 한 단락 → 재물 총평 → 연애 총평 → 직업 총평 → 건강 → 올해를 관통하는 조언
예시: "2026년은 선택의 해. 올해 고른 길이 향후 10년을 결정함."
대운 흐름과 연결해서 왜 올해가 중요한지 설득력 있게.` },
  ];
}

// ── 운세 섹션 (캐싱 지원) ───────────────────────────
function FortuneSection({ prompt, userId }: { prompt: string; userId: string | null }) {
  const navigate = useNavigate();
  const [coins, setCoins] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [fortuneResult, setFortuneResult] = useState<string | null>(null);
  const [fortuneExpiry, setFortuneExpiry] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 캐시된 운세 상태
  const [cachedFortunes, setCachedFortunes] = useState<Record<string, { text: string; expiresAt: string }>>({});

  // 코인 잔액 + 캐시 로드
  useEffect(() => {
    if (userId) {
      getCoinBalance(userId).then(setCoins).catch(() => setCoins(null));
    }
    // 캐시에서 기존 운세 로드
    const cached: Record<string, { text: string; expiresAt: string }> = {};
    for (const type of getFortuneTypes()) {
      const c = loadCache(`fortune_${type.key}`);
      if (c) cached[type.key] = { text: c.text, expiresAt: c.expiresAt };
    }
    setCachedFortunes(cached);
  }, [userId]);

  const handleFortune = async (type: any) => {
    // 캐시가 있으면 그냥 보여줌
    if (cachedFortunes[type.key]) {
      setActiveType(type.key);
      setFortuneResult(cachedFortunes[type.key].text);
      setFortuneExpiry(cachedFortunes[type.key].expiresAt);
      return;
    }

    if (!userId) {
      setError('온보딩을 먼저 완료해주세요 (생년월일 입력)');
      return;
    }

    setActiveType(type.key);
    setFortuneResult(null);
    setFortuneExpiry(null);
    setLoading(true);
    setError(null);

    try {
      const newBalance = await deductCoins(userId, type.cost);
      setCoins(newBalance);

      const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

      // Supabase에서 커스텀 프롬프트 확인
      let customPromptExtra = type.promptExtra;
      try {
        const { data } = await supabase.from("app_settings")
          .select("value").eq("key", type.settingsKey).single();
        if (data?.value) customPromptExtra = data.value;
      } catch {}

      const fortunePrompt = `오늘 날짜는 ${today}입니다.

아래 사주를 기반으로 ${type.label}를 작성해줘.
${customPromptExtra}

${prompt}`;

      const text = await callGemini(fortunePrompt);
      const expiry = getExpiryDate(type.key);

      setFortuneResult(text);
      setFortuneExpiry(expiry.toISOString());

      // 캐시에 저장
      saveCache(`fortune_${type.key}`, text, expiry);
      setCachedFortunes(prev => ({ ...prev, [type.key]: { text, expiresAt: expiry.toISOString() } }));

      // DB에도 저장
      await saveFortune({
        userId,
        fortuneType: type.key,
        cost: type.cost,
        sajuPrompt: prompt,
        result: text,
      }).catch(() => {});

    } catch (e: any) {
      setError(e.message || '운세 생성 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 코인 잔액 */}
      {coins !== null && (
        <div className="flex items-center justify-between bg-surface border border-border rounded-lg px-4 py-2">
          <span className="text-sm text-muted-foreground">보유 코인</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gold-gradient">{coins} 🪙</span>
            <button
              onClick={() => navigate('/coin-shop')}
              className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
            >
              충전
            </button>
          </div>
        </div>
      )}

      {/* 운세 버튼 4개 */}
      <div className="grid grid-cols-2 gap-2">
        {getFortuneTypes().map((type) => {
          const hasCached = !!cachedFortunes[type.key];
          return (
            <button
              key={type.key}
              onClick={() => handleFortune(type)}
              disabled={loading}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none ${
                activeType === type.key
                  ? 'bg-primary/10 border-primary/30 glow-gold'
                  : hasCached
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-surface border-border hover:border-primary/20'
              }`}
            >
              <span className="text-lg">{type.icon}</span>
              <span className="text-xs font-medium text-foreground">{type.label}</span>
              {hasCached ? (
                <span className="text-[10px] text-green-400">{getRemainingText(cachedFortunes[type.key].expiresAt)}</span>
              ) : (
                <span className="text-[10px] text-primary">{type.cost} 코인</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 코인 부족 안내 */}
      {coins !== null && coins < 1 && !Object.keys(cachedFortunes).length && (
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 text-xs text-yellow-400">
          코인이 부족합니다. 추후 코인 충전 기능이 추가될 예정입니다.
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-8">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">운세를 점치는 중...</span>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="rounded-lg bg-red-500/20 text-red-400 px-3 py-2 text-xs font-medium">
          {error}
          {error.includes('부족') && (
            <button onClick={() => navigate('/coin-shop')} className="ml-2 underline text-primary">
              코인 충전하기
            </button>
          )}
        </div>
      )}

      {/* 운세 결과 */}
      {fortuneResult && (
        <div className="bg-card border border-border rounded-xl p-4 glow-mystical animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">{getFortuneTypes().find(t => t.key === activeType)?.icon}</span>
              <p className="text-sm font-medium text-primary">{getFortuneTypes().find(t => t.key === activeType)?.label}</p>
            </div>
            {fortuneExpiry && (
              <span className="text-[10px] text-muted-foreground">{getRemainingText(fortuneExpiry)}</span>
            )}
          </div>
          <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{fortuneResult}</div>
        </div>
      )}
    </div>
  );
}

// ── 입력 폼 ─────────────────────────────────────────
function SajuInputForm({ onAnalyze }: { onAnalyze: (result: SajuResult) => void }) {
  const [birthDigits, setBirthDigits] = useState("");
  const [timeDigits, setTimeDigits] = useState("");
  const [gender, setGender] = useState<"남" | "여" | null>(null);
  const [calendarType, setCalendarType] = useState<"양력" | "음력">("양력");
  const [error, setError] = useState<string | null>(null);

  const birthFormatted = (() => {
    const d = birthDigits;
    if (d.length <= 4) return d;
    if (d.length <= 6) return d.slice(0, 4) + "-" + d.slice(4);
    return d.slice(0, 4) + "-" + d.slice(4, 6) + "-" + d.slice(6);
  })();

  const timeFormatted = (() => {
    const d = timeDigits;
    if (d.length <= 2) return d;
    return d.slice(0, 2) + ":" + d.slice(2);
  })();

  const isValid = birthDigits.length === 8 && timeDigits.length >= 3 && gender;

  const handleAnalyze = () => {
    if (!isValid || !gender) return;
    setError(null);
    try {
      const result = getSaju({
        year: Number(birthDigits.slice(0, 4)),
        month: Number(birthDigits.slice(4, 6)),
        day: Number(birthDigits.slice(6, 8)),
        hour: Number(timeDigits.slice(0, 2)),
        gender, calendarType,
      });
      onAnalyze(result);
    } catch (e: any) {
      setError(e.message || "사주 분석 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <label className="text-sm font-medium text-foreground mb-3 block">달력 유형</label>
        <div className="flex gap-2">
          {(["양력", "음력"] as const).map((type) => (
            <button key={type} onClick={() => setCalendarType(type)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                calendarType === type ? "bg-primary text-primary-foreground" : "bg-surface border border-border text-muted-foreground hover:text-foreground"
              }`}>{type}</button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <label className="text-sm font-medium text-foreground">생년월일 *</label>
        <input type="tel" placeholder="YYYYMMDD" value={birthFormatted}
          onChange={(e) => setBirthDigits(e.target.value.replace(/\D/g, "").slice(0, 8))}
          className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors" />
        {birthDigits.length === 8 && (
          <p className="text-xs text-primary">{birthDigits.slice(0, 4)}-{birthDigits.slice(4, 6)}-{birthDigits.slice(6)}</p>
        )}
      </section>

      <section className="space-y-2">
        <label className="text-sm font-medium text-foreground">태어난 시간 *</label>
        <input type="tel" placeholder="HHMM" value={timeFormatted}
          onChange={(e) => setTimeDigits(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors" />
        {timeDigits.length >= 3 && (
          <p className="text-xs text-primary">{timeDigits.slice(0, 2)}:{timeDigits.slice(2).padEnd(2, "0")} (24시간제)</p>
        )}
      </section>

      <section>
        <label className="text-sm font-medium text-foreground mb-3 block">성별 *</label>
        <div className="flex gap-2">
          {(["남", "여"] as const).map((g) => (
            <button key={g} onClick={() => setGender(g)}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                gender === g ? "bg-primary text-primary-foreground" : "bg-surface border border-border text-muted-foreground hover:text-foreground"
              }`}>{g === "남" ? "남성 ♂" : "여성 ♀"}</button>
          ))}
        </div>
      </section>

      {error && <div className="rounded-lg bg-red-500/20 text-red-400 px-3 py-2 text-xs">{error}</div>}

      <button disabled={!isValid} onClick={handleAnalyze}
        className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none glow-gold">
        사주 분석하기
      </button>
    </div>
  );
}

// localStorage에서 사주 데이터 읽기
function loadSajuInput() {
  try { const r = localStorage.getItem("artsoul-saju-input"); if (r) { const d = JSON.parse(r); if (d.birthDate && d.gender) return d; } } catch {}
  try { const r = localStorage.getItem("artsoul-onboarding"); if (r) { const p = JSON.parse(r); const s = p.state || p; if (s.birthDate && s.gender) return s; } } catch {}
  return null;
}

// ── 메인 사주 페이지 ────────────────────────────────
const SajuPage = () => {
  const navigate = useNavigate();
  const store = useOnboardingStore();
  const userId = store.userId;

  const [result, setResult] = useState<SajuResult | null>(null);

  // 사주 자동 계산 — mount + store 변경 + 200ms 후 재시도
  useEffect(() => {
    function tryCalc() {
      let bd = '', bt: string | null = null, g = '';
      const ls = loadSajuInput();
      if (ls) { bd = ls.birthDate; bt = ls.birthTime; g = ls.gender; }
      if (!bd && store.birthDate) { bd = store.birthDate; bt = store.birthTime; g = store.gender || ''; }
      if (!bd || !g) return false;
      try {
        const [y, m, d] = bd.split("-").map(Number);
        const hour = bt ? Number(bt.split(":")[0]) : 12;
        setResult(getSaju({ year: y, month: m, day: d, hour, gender: g === "male" ? "남" : "여", calendarType: "양력" }));
        return true;
      } catch { return false; }
    }
    if (!tryCalc()) {
      // 즉시 실패하면 200ms 후 재시도 (zustand hydration 대기)
      const t = setTimeout(tryCalc, 200);
      return () => clearTimeout(t);
    }
  }, [store.birthDate, store.gender]);

  const aiPrompt = useMemo(() => result ? sajuToAIPrompt(result) : "", [result]);

  if (!result) {
    // localStorage에 데이터가 있으면 잠시 로딩 표시 (hydration 대기)
    const hasLocalData = !!loadSajuInput();
    return (
      <PageContainer className="pt-20">
        <TabBar activeTab="home" />
        {hasLocalData ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
            <p className="text-sm text-muted-foreground">사주를 분석하고 있습니다...</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-display text-gold-gradient font-semibold mb-2">사주팔자 분석</h1>
            <p className="text-sm text-muted-foreground mb-8">생년월일시를 입력하면 사주를 분석해드립니다</p>
            <SajuInputForm onAnalyze={setResult} />
          </>
        )}
      </PageContainer>
    );
  }

  const { yeonju, wolju, ilju, siju, sipsung, twelveStages, gyeokguk, sinsal, gongmang, relations, daeun, daeunStartAge, solarDate, input } = result;

  // 추가 분석
  const summary = getSajuSummary(result);
  const balance = getOhaengBalance(result);
  const ohaengAnalysis = getOhaengAnalysis(balance, `${ilju.cheonganKor}(${ilju.ohaeng})`);
  const yongsin = getYongsin(balance, ilju.ohaeng);
  const lucky = getLuckyItems(yongsin.element);
  const pillarMeanings = getPillarMeanings(result);

  // 125 케이스코드 분석 (강화된 용신 엔진)
  const enhancedYongsin = analyzeYongsin(
    { yeonju, wolju, ilju, siju },
    sipsung,
  );
  const caseCodeRecommendation = matchSajuToCases({
    sajuResult: result,
    yongsinResult: enhancedYongsin,
  });
  const caseCodeResults = caseCodeRecommendation.all;
  const topBaseCases = getTopBaseCases(caseCodeRecommendation, 3);

  return (
    <PageContainer className="pt-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-display text-gold-gradient font-semibold">사주팔자 분석 결과</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {solarDate.year}.{solarDate.month}.{solarDate.day} ({input.gender}) · {result.jeolgiName}
          </p>
        </div>
        <button onClick={() => setResult(null)} className="text-xs text-muted-foreground hover:text-primary transition-colors">
          다시 분석
        </button>
      </div>

      {/* 사주 총평 */}
      <Section title="사주 총평">
        <div className="bg-card border border-border rounded-xl p-4 glow-mystical">
          <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{summary}</div>
        </div>
      </Section>

      <Section title="사주팔자 (四柱八字)">
        {/* 4주 카드 — 가로 배치 (반응형) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <PillarCard label="시주" ganji={siju} sipsungCg={sipsung.sijuCg} sipsungJj={sipsung.sijuJj} twelveJj={twelveStages.sijuJj} />
          <PillarCard label="일주 (나)" ganji={ilju} sipsungJj={sipsung.iljuJj} twelveJj={twelveStages.iljuJj} />
          <PillarCard label="월주" ganji={wolju} sipsungCg={sipsung.woljuCg} sipsungJj={sipsung.woljuJj} twelveJj={twelveStages.woljuJj} />
          <PillarCard label="연주" ganji={yeonju} sipsungCg={sipsung.yeonjuCg} sipsungJj={sipsung.yeonjuJj} twelveJj={twelveStages.yeonjuJj} />
        </div>

        {/* 주별 해석 — 세로 리스트, 가독성 높게 */}
        <div className="space-y-3 mt-5">
          {[
            { pmKey: "연주 (年柱)", label: "연주" },
            { pmKey: "월주 (月柱)", label: "월주" },
            { pmKey: "일주 (日柱)", label: "일주" },
            { pmKey: "시주 (時柱)", label: "시주" },
          ].map(({ pmKey, label }) => {
            const pm = pillarMeanings.find(m => m.label === pmKey);
            if (!pm) return null;
            return (
              <div key={pmKey} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{pm.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">{pm.lifeStage}</span>
                  <span className="text-xs text-muted-foreground">{pm.ageRange}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1.5">관계: {pm.relationship}</p>
                <p className="text-sm text-foreground/80 leading-[1.8]">{pm.description}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 오행 밸런스 */}
      <Section title="음양오행 밸런스">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex justify-between mb-3">
            {(Object.entries(balance) as [string, number][]).map(([ohaeng, count]) => {
              const style = getOhaengStyle(ohaeng);
              return (
                <div key={ohaeng} className="text-center flex-1">
                  <div className={`mx-auto w-10 h-10 rounded-full ${style.bg} ${style.border} border flex items-center justify-center mb-1`}>
                    <span className={`text-lg font-bold ${style.text}`}>{count}</span>
                  </div>
                  <p className={`text-xs font-medium ${style.text}`}>{ohaeng}</p>
                </div>
              );
            })}
          </div>
          <div className="space-y-2 mt-3">
            <p className="text-sm text-foreground/80">{ohaengAnalysis.description}</p>
            <div className="flex gap-2 flex-wrap">
              {ohaengAnalysis.dominant.map(d => {
                const s = getOhaengStyle(d);
                return <span key={d} className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>강: {d}</span>;
              })}
              {ohaengAnalysis.lacking.map(l => {
                const s = getOhaengStyle(l);
                return <span key={l} className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.text} opacity-60`}>약: {l}</span>;
              })}
            </div>
          </div>
        </div>
      </Section>

      {/* 주별 해석은 위 사주팔자 섹션 안에 통합됨 */}

      {/* 격국 */}
      <Section title="격국 (格局)">
        <div className="bg-card border border-border rounded-xl p-4 glow-mystical">
          <p className="text-base font-semibold text-gold-gradient mb-1">{gyeokguk.name}</p>
          <p className="text-sm text-foreground/80">{gyeokguk.description}</p>
          <p className="text-xs text-muted-foreground mt-2">기본 십성: {gyeokguk.baseSipsung}</p>
        </div>
      </Section>

      {/* 용신 + 예술 추천 */}
      <Section title="용신 · 추천 예술 (用神)">
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-foreground">용신</span>
              <span className={`text-sm font-bold ${getOhaengStyle(yongsin.element).text}`}>{yongsin.element}</span>
            </div>
            <p className="text-xs text-foreground/80">{yongsin.reason}</p>
          </div>

          {/* 행운 색상 */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">나에게 맞는 색상</p>
            <div className="flex gap-2">
              {lucky.colorHexes.map((hex, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: hex }} />
                  <span className="text-[9px] text-muted-foreground mt-0.5">{lucky.colors[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 추천 화풍 */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">추천 화풍</p>
            <div className="flex flex-wrap gap-1.5">
              {lucky.artStyles.map((s, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">{s.emoji} {s.label}</span>
              ))}
            </div>
          </div>

          {/* 추천 작품 소재 */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">어울리는 작품 소재</p>
            <div className="flex flex-wrap gap-1.5">
              {lucky.artSubjects.map((s, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-surface border border-border text-foreground">{s.emoji} {s.label}</span>
              ))}
            </div>
          </div>

          {/* 추천 분위기 */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">추천 분위기</p>
            <div className="flex flex-wrap gap-1.5">
              {lucky.artMoods.map((s, i) => (
                <span key={i} className={`text-xs px-2.5 py-1 rounded-full ${getOhaengStyle(yongsin.element).bg} ${getOhaengStyle(yongsin.element).text}`}>{s.emoji} {s.label}</span>
              ))}
            </div>
          </div>

          {/* 방향/계절 */}
          <div className="flex gap-4 text-xs">
            <span className="text-muted-foreground">방향: <span className="text-foreground">{lucky.direction}</span></span>
            <span className="text-muted-foreground">계절: <span className="text-foreground">{lucky.season}</span></span>
            <span className="text-muted-foreground">숫자: <span className="text-foreground">{lucky.number}</span></span>
          </div>
        </div>
      </Section>

      {/* 나의 운명과 맞는 ARTs */}
      <Section title="나의 운명과 맞는 ARTs">
        <div className="space-y-5">
          {/* 추천 요약 — 재미있게 */}
          {(() => {
            const top = caseCodeResults[0];
            if (!top) return null;
            const el = ELEMENT_MAP[top.element];
            const en = ENERGY_MAP[top.energy];
            const st = STYLE_MAP[top.style];
            const yEl = enhancedYongsin.yongsin;
            const dayOh = enhancedYongsin.dayOhaeng;
            const strength = enhancedYongsin.dayStrength;

            const intro = strength === "강"
              ? `${dayOh} 기운이 넘치는 당신, ${yEl}의 에너지가 담긴 그림이 사주의 열기를 식혀주고 마음에 균형을 가져다줄 거예요.`
              : strength === "약"
              ? `${dayOh}이(가) 조금 약한 당신에게 ${yEl}의 기운이 담긴 그림은 마치 좋은 보약 같은 존재예요. 공간에 두기만 해도 기운이 살아납니다.`
              : `중화된 사주라 균형이 좋은 편이지만, ${yEl}의 포인트를 살짝 더하면 삶의 질이 확 달라질 수 있어요.`;

            const artDesc = `${el?.labelKor}의 색감에 ${en?.labelKor}의 구도, ${st?.labelKor} 스타일 — 이 조합이 당신의 부족한 오행을 채워주면서도 자연스럽게 공간에 녹아듭니다.`;

            return (
              <div className="bg-card border border-primary/20 rounded-2xl p-5 glow-mystical">
                <p className="text-sm font-semibold text-primary mb-2">당신의 사주가 부르는 그림</p>
                <p className="text-sm text-foreground/85 leading-relaxed mb-3">{intro}</p>
                <p className="text-xs text-foreground/70">{artDesc}</p>
              </div>
            );
          })()}

          {/* 추천 카드 3장 */}
          <div className="grid grid-cols-3 gap-3">
            {caseCodeResults.slice(0, 3).map((r, i) => {
              const el = ELEMENT_MAP[r.element];
              const en = ENERGY_MAP[r.energy];
              const st = STYLE_MAP[r.style];
              return (
                <div key={r.caseCode} className={`rounded-xl overflow-hidden border transition-all ${i === 0 ? "border-primary/30 glow-gold" : "border-border"}`}>
                  <div className="aspect-[3/4]">
                    <CaseCodeArt element={r.element} energy={r.energy} style={r.style} />
                  </div>
                  <div className="p-3 bg-surface">
                    <p className="text-xs font-medium text-foreground">{el?.labelKor} · {en?.labelKor}</p>
                    <p className="text-[10px] text-muted-foreground">{st?.labelKor} 스타일</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-primary font-medium">{i === 0 ? "최적 추천" : `${i + 1}순위`}</span>
                      <span className="text-xs font-bold text-primary">{r.totalScore}점</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 왜 이 그림인지 설명 */}
          {(() => {
            const top3 = caseCodeResults.slice(0, 3);
            const yEl = enhancedYongsin.yongsin;
            const elements = [...new Set(top3.map(r => ELEMENT_MAP[r.element]?.labelKor))].join(', ');
            const energies = [...new Set(top3.map(r => ENERGY_MAP[r.energy]?.labelKor))].join(', ');
            const styles = [...new Set(top3.map(r => STYLE_MAP[r.style]?.labelKor))].join(', ');

            return (
              <div className="bg-surface rounded-xl p-4">
                <p className="text-xs text-primary font-medium mb-2">왜 이 그림들일까요?</p>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  당신의 용신인 <span className={`font-semibold ${getOhaengStyle(yEl).text}`}>{yEl}</span> 오행이 부족하기 때문에,
                  {' '}{elements} 계열의 색감이 사주 균형을 맞춰줍니다.
                  {' '}{energies} 에너지의 구도가 공간에 적절한 기운을 불어넣고,
                  {' '}{styles} 스타일이 당신의 취향과 사주 모두를 만족시킵니다.
                </p>
              </div>
            );
          })()}

          {/* 추천 작품 (DB/샘플) */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">이런 작품은 어떠세요?</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(() => {
                const codes = caseCodeResults.slice(0, 4).map(r => r.caseCode);
                const arts = getRecommendedArtworks(codes, 4);
                return arts.map((art: any) => (
                  <div key={art.id} className="group cursor-pointer" onClick={() => navigate(`/artwork/${art.id}`)}>
                    <div className="aspect-square rounded-xl overflow-hidden border border-border mb-2 transition-all group-hover:border-primary/30">
                      <CaseCodeArt element={art.element} energy={art.energy} style={art.style} />
                    </div>
                    <p className="text-xs font-medium text-foreground truncate">{art.title.split("—")[0].trim()}</p>
                    <p className="text-[10px] text-muted-foreground">{art.artist}</p>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </Section>

      {/* 공망 */}
      <Section title="공망 (空亡)">
        <div className="flex gap-3">
          <div className="bg-surface border border-border rounded-lg px-4 py-2 text-center">
            <p className="text-lg font-bold text-foreground">{gongmang.jiji1}</p>
            <p className="text-xs text-muted-foreground">{gongmang.jiji1Kor}</p>
          </div>
          <div className="bg-surface border border-border rounded-lg px-4 py-2 text-center">
            <p className="text-lg font-bold text-foreground">{gongmang.jiji2}</p>
            <p className="text-xs text-muted-foreground">{gongmang.jiji2Kor}</p>
          </div>
        </div>
      </Section>

      {/* 합충형파해 */}
      <Section title="합충형파해 (合沖刑破害)">
        <RelationsList relations={relations} />
      </Section>

      {/* 신살 */}
      <Section title="신살 (神殺)">
        <SinsalList sinsal={sinsal} yongsinOh={enhancedYongsin.yongsin} dayOh={ilju.ohaeng} />
      </Section>

      {/* 대운 */}
      <Section title="대운 (大運)">
        <DaeunTimeline daeun={daeun} startAge={daeunStartAge}
          birthYear={solarDate.year}
          dayOh={ilju.ohaeng} yongsinOh={enhancedYongsin.yongsin}
          dayStrength={enhancedYongsin.dayStrength} sinsal={sinsal} />
      </Section>

      {/* AI 해석 */}
      <Section title="AI 해석">
        <AIInterpretation prompt={aiPrompt} userId={userId} />
      </Section>

      <Section title="운세 보기">
        <FortuneSection prompt={aiPrompt} userId={userId} />
      </Section>

      <TabBar activeTab="home" />
    </PageContainer>
  );
};

export default SajuPage;
