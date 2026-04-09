import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import TabBar from "@/components/TabBar";
import { ChevronRight } from "lucide-react";
import CaseCodeArt from "@/components/CaseCodeArt";
import { getRecommendedArtworks, getSampleArtworks } from "@/data/sample-artworks";
import { useOnboardingStore } from "@/stores/onboarding";
import { getSaju, sajuToAIPrompt } from "@/lib/saju";
import type { SajuResult } from "@/lib/saju";
import { getOhaengBalance, getYongsin, getLuckyItems, getSajuSummary } from "@/lib/saju/analysis";
import { analyzeYongsin } from "@/lib/saju/yongsin";
import { matchSajuToCases } from "@/lib/case-code";
import { ELEMENT_MAP, ENERGY_MAP, STYLE_MAP } from "@/lib/case-code/types";

const OHAENG_COLORS: Record<string, { bg: string; text: string }> = {
  목: { bg: "bg-green-500/20", text: "text-green-400" },
  화: { bg: "bg-red-500/20", text: "text-red-400" },
  토: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  금: { bg: "bg-gray-400/20", text: "text-gray-300" },
  수: { bg: "bg-blue-500/20", text: "text-blue-400" },
};

// 오행별 데모 추천 작품
const OHAENG_ARTWORKS: Record<string, Array<{ id: string; title: string; artist: string; emoji: string; reason: string }>> = {
  목: [
    { id: "w1", title: "봄날의 숲", artist: "김수연", emoji: "🌿", reason: "목 기운 보충" },
    { id: "w2", title: "대나무 수묵", artist: "이현석", emoji: "🎋", reason: "성장 에너지" },
    { id: "w3", title: "초록빛 정원", artist: "박서연", emoji: "🌱", reason: "자연의 생명력" },
    { id: "w4", title: "비 온 뒤 신록", artist: "최하늘", emoji: "🍃", reason: "새로운 시작" },
  ],
  화: [
    { id: "f1", title: "붉은 노을", artist: "이도윤", emoji: "🌅", reason: "화 기운 보충" },
    { id: "f2", title: "열정의 추상", artist: "김태리", emoji: "🔥", reason: "에너지 활성화" },
    { id: "f3", title: "해바라기", artist: "정은채", emoji: "🌻", reason: "밝은 기운" },
    { id: "f4", title: "석양의 바다", artist: "한지민", emoji: "🌄", reason: "따뜻한 감성" },
  ],
  토: [
    { id: "e1", title: "황토빛 언덕", artist: "오현석", emoji: "🏔️", reason: "토 기운 보충" },
    { id: "e2", title: "전통 민화", artist: "유재석", emoji: "🎨", reason: "안정감" },
    { id: "e3", title: "도자기 정물", artist: "김민수", emoji: "🏺", reason: "전통의 따뜻함" },
    { id: "e4", title: "가을 들판", artist: "박서연", emoji: "🌾", reason: "풍요로움" },
  ],
  금: [
    { id: "m1", title: "은빛 달밤", artist: "최하늘", emoji: "🌙", reason: "금 기운 보충" },
    { id: "m2", title: "미니멀 공간", artist: "이현석", emoji: "⬜", reason: "절제의 미학" },
    { id: "m3", title: "겨울 나무", artist: "한지민", emoji: "🌲", reason: "깨끗한 에너지" },
    { id: "m4", title: "금속 조각", artist: "김태리", emoji: "✨", reason: "정밀함" },
  ],
  수: [
    { id: "a1", title: "바다의 숨결", artist: "정은채", emoji: "🌊", reason: "수 기운 보충" },
    { id: "a2", title: "비 오는 거리", artist: "오현석", emoji: "🌧️", reason: "깊은 사유" },
    { id: "a3", title: "호수의 새벽", artist: "김수연", emoji: "🏞️", reason: "고요한 지혜" },
    { id: "a4", title: "수묵 산수", artist: "이도윤", emoji: "⛰️", reason: "유연한 흐름" },
  ],
};

// 사주 입력 데이터 읽기 (직접 저장 + zustand persist)
function getSajuInput() {
  try {
    const direct = localStorage.getItem("artsoul-saju-input");
    if (direct) { const d = JSON.parse(direct); if (d.birthDate && d.gender) return d; }
  } catch {}
  try {
    const raw = localStorage.getItem("artsoul-onboarding");
    if (raw) { const p = JSON.parse(raw); const s = p.state || p; if (s.birthDate && s.gender) return s; }
  } catch {}
  return null;
}

const HomePage = () => {
  const navigate = useNavigate();
  const store = useOnboardingStore();
  const [subTab, setSubTab] = useState<"recommend" | "saju">("recommend");
  const [directData, setDirectData] = useState<any>(null);

  useEffect(() => { const d = getSajuInput(); if (d) setDirectData(d); }, []);

  const nameKorean = store.nameKorean || directData?.nameKorean || '';
  const birthDate = store.birthDate || directData?.birthDate || '';
  const birthTime = store.birthTime || directData?.birthTime || null;
  const gender = store.gender || directData?.gender || null;

  const analysis = useMemo(() => {
    if (!birthDate || !gender) return null;
    try {
      const [y, m, d] = birthDate.split("-").map(Number);
      const hour = birthTime ? Number(birthTime.split(":")[0]) : 12;
      const result = getSaju({ year: y, month: m, day: d, hour, gender: gender === "male" ? "남" : "여", calendarType: "양력" });
      const balance = getOhaengBalance(result);
      const yongsin = getYongsin(balance, result.ilju.ohaeng);
      const lucky = getLuckyItems(yongsin.element);
      const summary = getSajuSummary(result);

      const { yeonju, wolju, ilju, siju, sipsung } = result;
      const enhancedYongsin = analyzeYongsin({ yeonju, wolju, ilju, siju }, sipsung);
      const recommendation = matchSajuToCases({ sajuResult: result, yongsinResult: enhancedYongsin });
      const topCases = recommendation.all.slice(0, 5);

      const artworks = getRecommendedArtworks(topCases.map(c => c.caseCode), 8);
      return { result, yongsin, lucky, summary, enhancedYongsin, topCases, balance, artworks };
    } catch {
      return null;
    }
  }, [birthDate, birthTime, gender]);

  const recommendedArtworks = analysis
    ? OHAENG_ARTWORKS[analysis.yongsin.element] || OHAENG_ARTWORKS["목"]
    : [];

  return (
    <PageContainer className="pt-20">
      {/* 사주 미입력 시 */}
      {!analysis && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 text-center animate-fade-in">
          <span className="text-3xl mb-3 block">🎨</span>
          <p className="text-sm font-medium text-foreground mb-2">사주 기반 맞춤 추천</p>
          <p className="text-xs text-muted-foreground mb-4">생년월일을 입력하면 나에게 딱 맞는 그림을 추천해드려요</p>
          <button onClick={() => navigate("/birth-info")}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium glow-gold">
            사주 입력하기
          </button>
        </div>
      )}

      {/* 사주 입력 완료 시: 서브탭 */}
      {analysis && (
        <>
          {/* 서브탭 헤더 */}
          <div className="flex gap-1 mb-5 bg-surface rounded-xl p-1">
            {([
              { key: "recommend" as const, label: "추천 그림" },
              { key: "saju" as const, label: "사주 분석" },
            ]).map((tab) => (
              <button key={tab.key} onClick={() => setSubTab(tab.key)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  subTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── 추천 그림 탭 ── */}
          {subTab === "recommend" && (() => {
            const topCase = analysis.topCases[0];
            const yEl = analysis.enhancedYongsin.yongsin;
            const dayOh = analysis.result.ilju.ohaeng;
            const dayStrength = analysis.enhancedYongsin.dayStrength;
            const strengthComment = dayStrength === "강"
              ? `${dayOh}이(가) 강해서 ${yEl} 기운이 담긴 그림으로 균형을 잡아줄 수 있어요`
              : dayStrength === "약"
              ? `${dayOh}이(가) 약하니 ${yEl}의 힘을 빌려 기운을 보충해보세요`
              : `${dayOh}이(가) 중화라 ${yEl}의 그림으로 살짝 포인트를 줘보세요`;

            return (
            <div className="space-y-6 animate-fade-in">
              {/* 내 사주 + 추천 요약 */}
              <div className="bg-card border border-primary/20 rounded-2xl p-6 glow-mystical">
                <p className="text-xs text-primary font-medium mb-2">{nameKorean || "나"}님의 사주가 고른 그림</p>
                <p className="text-sm text-foreground leading-relaxed">
                  일간 <span className={`font-semibold ${OHAENG_COLORS[dayOh]?.text}`}>{analysis.result.ilju.cheonganKor}({dayOh})</span>
                  {" · "}{dayStrength}
                  {" → "}용신 <span className={`font-semibold ${OHAENG_COLORS[yEl]?.text}`}>{yEl}</span>
                </p>
                <p className="text-xs text-foreground/70 mt-2">{strengthComment}</p>
              </div>

              {/* 추천 작품 그리드 (웹 반응형) */}
              <div>
                <SectionHeader title={`${yEl} 기운 보충 작품`} />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {(analysis.artworks || []).slice(0, 8).map((art) => {
                    const el = ELEMENT_MAP[art.element];
                    const en = ENERGY_MAP[art.energy];
                    const st = STYLE_MAP[art.style];
                    return (
                      <div key={art.id} className="group cursor-pointer" onClick={() => navigate(`/artwork/${art.id}`)}>
                        <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border mb-2 transition-all group-hover:border-primary/30">
                          <CaseCodeArt element={art.element} energy={art.energy} style={art.style} />
                        </div>
                        <p className="text-sm font-medium text-foreground truncate">{art.title.split("—")[0].trim()}</p>
                        <p className="text-xs text-muted-foreground">{art.artist} · {el?.labelKor} {en?.labelKor}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 매칭 Top 5 — 섬네일 + 점수 + 설명 */}
              <div>
                <SectionHeader title="당신의 사주가 선택한 그림 Top 5" />
                <div className="space-y-3">
                  {analysis.topCases.map((c, i) => {
                    const el = ELEMENT_MAP[c.element];
                    const en = ENERGY_MAP[c.energy];
                    const st = STYLE_MAP[c.style];
                    const matchArt = (analysis.artworks || []).find(a => a.caseCode === c.caseCode);
                    const funDesc = c.recommendationType === "보완형"
                      ? `부족한 ${el?.labelKor} 기운을 채워주는 ${en?.labelKor} 에너지의 ${st?.labelKor} 작품`
                      : `당신의 강점 ${el?.labelKor}을 더 살려주는 ${en?.labelKor} 에너지의 작품`;
                    return (
                      <div key={c.caseCode} className="bg-card border border-border rounded-xl p-4 flex gap-4 items-center transition-all hover:border-primary/30">
                        {/* 랭크 */}
                        <div className="shrink-0 w-8 text-center">
                          <span className={`text-lg font-bold ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>{i + 1}</span>
                        </div>
                        {/* 섬네일 */}
                        <div className="shrink-0 w-16 h-20 rounded-lg overflow-hidden border border-border">
                          <CaseCodeArt element={c.element} energy={c.energy} style={c.style} />
                        </div>
                        {/* 설명 */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {el?.labelKor} × {en?.labelKor} × {st?.labelKor}
                          </p>
                          <p className="text-xs text-foreground/70 mt-0.5">{funDesc}</p>
                          {matchArt && <p className="text-[10px] text-muted-foreground mt-1">{matchArt.artist} · {matchArt.title.split("—")[0].trim()}</p>}
                        </div>
                        {/* 점수 */}
                        <div className="shrink-0 text-right">
                          <span className="text-xl font-bold text-primary">{c.totalScore}</span>
                          <p className="text-[9px] text-muted-foreground">매칭</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 행운 색상 + 스타일 */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <p className="text-sm font-semibold text-foreground mb-4">사주가 추천하는 아트 스타일</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground mb-2">행운 컬러</p>
                    <div className="flex justify-center gap-2">
                      {analysis.lucky.colorHexes.map((hex, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: hex }} />
                          <span className="text-[9px] text-muted-foreground mt-1">{analysis.lucky.colors[i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground mb-2">추천 화풍</p>
                    <p className="text-xs text-foreground">{analysis.lucky.artStyles.join(', ')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground mb-2">추천 소재</p>
                    <p className="text-xs text-foreground">{analysis.lucky.artSubjects.slice(0, 2).join(', ')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground mb-2">추천 분위기</p>
                    <p className="text-xs text-foreground">{analysis.lucky.artMoods.join(', ')}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {analysis.lucky.direction}에 두면 기운이 강해지고, {analysis.lucky.season}에 특히 효과적이에요.
                </p>
              </div>
            </div>
          );
          })()}

          {/* ── 사주 분석 탭 ── */}
          {subTab === "saju" && (
            <div className="space-y-4 animate-fade-in">
              {/* 사주팔자 */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs text-muted-foreground mb-3">사주팔자 (四柱八字)</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {(["시주", "일주", "월주", "연주"] as const).map((label, i) => {
                    const pillar = [analysis.result.siju, analysis.result.ilju, analysis.result.wolju, analysis.result.yeonju][i];
                    const cgStyle = OHAENG_COLORS[pillar.ohaeng] || { bg: "bg-surface", text: "text-foreground" };
                    const jjStyle = OHAENG_COLORS[pillar.jijiOhaeng] || { bg: "bg-surface", text: "text-foreground" };
                    return (
                      <div key={label}>
                        <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
                        <div className={`rounded-lg ${cgStyle.bg} p-2 mb-1`}>
                          <p className={`text-xl font-bold ${cgStyle.text}`}>{pillar.cheongan}</p>
                          <p className="text-[9px] text-muted-foreground">{pillar.cheonganKor}·{pillar.ohaeng}</p>
                        </div>
                        <div className={`rounded-lg ${jjStyle.bg} p-2`}>
                          <p className={`text-xl font-bold ${jjStyle.text}`}>{pillar.jiji}</p>
                          <p className="text-[9px] text-muted-foreground">{pillar.jijiKor}·{pillar.jijiOhaeng}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 오행 밸런스 */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs text-muted-foreground mb-3">오행 밸런스</p>
                <div className="flex gap-2">
                  {(["목", "화", "토", "금", "수"] as const).map((oh) => {
                    const count = analysis.balance[oh];
                    const maxCount = Math.max(...Object.values(analysis.balance), 1);
                    const style = OHAENG_COLORS[oh];
                    return (
                      <div key={oh} className="flex-1 text-center">
                        <div className="h-16 flex items-end justify-center mb-1">
                          <div className={`w-full rounded-t-lg ${style.bg}`}
                            style={{ height: `${Math.max((count / maxCount) * 100, 12)}%` }} />
                        </div>
                        <p className={`text-xs font-bold ${style.text}`}>{oh}</p>
                        <p className="text-[10px] text-muted-foreground">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 용신 요약 */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs text-muted-foreground mb-2">용신 분석 (用神)</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-lg font-bold ${OHAENG_COLORS[analysis.enhancedYongsin.dayOhaeng]?.text}`}>
                    {analysis.enhancedYongsin.dayOhaeng}
                  </span>
                  <span className="text-sm text-foreground">일간 · {analysis.enhancedYongsin.dayStrength}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 mb-2">
                  <p>용신: <span className={`font-semibold ${OHAENG_COLORS[analysis.enhancedYongsin.yongsin]?.text}`}>{analysis.enhancedYongsin.yongsin}</span></p>
                  <p>희신: {analysis.enhancedYongsin.huisin} · 기신: {analysis.enhancedYongsin.gisin}</p>
                </div>
                <p className="text-xs text-foreground/70">{analysis.enhancedYongsin.summary}</p>
              </div>

              {/* 상세 사주 보기 */}
              <button onClick={() => navigate("/saju")}
                className="w-full py-3 rounded-xl bg-surface border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-1">
                상세 사주 분석 보기 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      <TabBar activeTab="home" />
    </PageContainer>
  );
};

const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    <button className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5">
      더보기 <ChevronRight className="w-3 h-3" />
    </button>
  </div>
);

export default HomePage;
