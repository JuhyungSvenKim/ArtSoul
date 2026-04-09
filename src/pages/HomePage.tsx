import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import TabBar from "@/components/TabBar";
import { ChevronRight } from "lucide-react";
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

const HomePage = () => {
  const navigate = useNavigate();
  const { nameKorean, birthDate, birthTime, gender } = useOnboardingStore();
  const [subTab, setSubTab] = useState<"recommend" | "saju">("recommend");

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

      return { result, yongsin, lucky, summary, enhancedYongsin, topCases, balance };
    } catch {
      return null;
    }
  }, [birthDate, birthTime, gender]);

  const recommendedArtworks = analysis
    ? OHAENG_ARTWORKS[analysis.yongsin.element] || OHAENG_ARTWORKS["목"]
    : [];

  return (
    <PageContainer className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-display text-gold-gradient font-semibold">ART.D.N.A.</h1>
        <button onClick={() => navigate("/coin-shop")}
          className="text-xs px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-medium hover:bg-yellow-500/20 transition-colors">
          🪙 충전
        </button>
      </div>

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
          {subTab === "recommend" && (
            <div className="space-y-5 animate-fade-in">
              {/* 내 ART DNA 요약 카드 */}
              <div className="bg-card border border-border rounded-2xl p-5 glow-mystical">
                <p className="text-[10px] text-muted-foreground mb-2">{nameKorean || "나"}의 ART DNA</p>
                <div className="flex items-center gap-3 mb-3">
                  {analysis.topCases[0] && (
                    <span className="text-base font-mono font-bold px-3 py-1 rounded-lg"
                      style={{
                        backgroundColor: `${ELEMENT_MAP[analysis.topCases[0].element]?.color}20`,
                        color: ELEMENT_MAP[analysis.topCases[0].element]?.color,
                        border: `1px solid ${ELEMENT_MAP[analysis.topCases[0].element]?.color}40`,
                      }}>
                      {analysis.topCases[0].caseCode}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      용신 <span className={OHAENG_COLORS[analysis.yongsin.element]?.text}>{analysis.yongsin.element}</span>
                      {" · "}일간 {analysis.result.ilju.cheonganKor}({analysis.result.ilju.ohaeng})
                    </p>
                    <p className="text-xs text-muted-foreground">{analysis.yongsin.reason}</p>
                  </div>
                </div>
              </div>

              {/* 용신 기반 추천 */}
              <div>
                <SectionHeader title={`${analysis.yongsin.element} 기운 보충 작품`} />
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                  {recommendedArtworks.map((art) => (
                    <div key={art.id} className="shrink-0 w-32">
                      <div className="w-32 h-40 rounded-xl bg-surface border border-border flex items-center justify-center text-4xl mb-2">
                        {art.emoji}
                      </div>
                      <p className="text-xs font-medium text-foreground truncate">{art.title}</p>
                      <p className="text-[10px] text-muted-foreground">{art.artist}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 125 케이스코드 Top 5 */}
              <div>
                <SectionHeader title="ART DNA 매칭 Top 5" />
                <div className="space-y-2">
                  {analysis.topCases.map((c, i) => {
                    const el = ELEMENT_MAP[c.element];
                    return (
                      <div key={c.caseCode} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                        <span className="text-xs font-mono font-bold w-6 text-center text-muted-foreground">{i + 1}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{
                          backgroundColor: `${el?.color}20`, color: el?.color, border: `1px solid ${el?.color}40`
                        }}>{c.caseCode}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground truncate">{c.reason}</p>
                        </div>
                        <span className="text-sm font-bold text-primary">{c.totalScore}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 행운 색상 */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs text-muted-foreground mb-3">행운 컬러</p>
                <div className="flex gap-3">
                  {analysis.lucky.colorHexes.map((hex, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full border border-border" style={{ backgroundColor: hex }} />
                      <span className="text-[10px] text-muted-foreground mt-1">{analysis.lucky.colors[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
