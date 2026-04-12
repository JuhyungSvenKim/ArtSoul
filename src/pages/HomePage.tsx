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
import { matchMbtiToArt } from "@/lib/mbti-art-engine";

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
  const [subTab, setSubTab] = useState<"recommend" | "mbti" | "saju">("recommend");
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

      const allCases = recommendation.all.slice(0, 20);
      const artworks = getRecommendedArtworks(allCases.map(c => c.caseCode), 20);
      return { result, yongsin, lucky, summary, enhancedYongsin, topCases, allCases, balance, artworks };
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
              { key: "recommend" as const, label: "사주 추천" },
              { key: "mbti" as const, label: "MBTI 추천" },
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

            const ohNames: Record<string, string> = { 목: "나무", 화: "불", 토: "흙", 금: "쇠", 수: "물" };
            const ohVibes: Record<string, string> = {
              목: "성장, 창의력, 새로운 시작의 에너지",
              화: "열정, 표현력, 빛나는 에너지",
              토: "안정, 신뢰, 든든한 에너지",
              금: "결단력, 집중, 날카로운 에너지",
              수: "지혜, 유연함, 깊은 사고의 에너지",
            };

            let hookLine = "";
            let explainLine = "";
            if (dayStrength === "강") {
              hookLine = `${nameKorean || "너"}의 ${ohNames[dayOh]} 에너지가 넘쳐흐르는 중이야`;
              explainLine = `${ohNames[dayOh]}(${dayOh}) 기운이 강한 사주라, ${ohNames[yEl]}(${yEl}) 기운이 담긴 그림을 곁에 두면 밸런스가 딱 맞아. 쉽게 말하면 사주가 "이 그림 옆에 있고 싶다"고 하는 거야.`;
            } else if (dayStrength === "약") {
              hookLine = `${nameKorean || "너"}한테 ${ohNames[yEl]} 에너지가 좀 필요해`;
              explainLine = `${ohNames[dayOh]}(${dayOh}) 기운이 약한 편이라, ${ohNames[yEl]}(${yEl}) 기운이 담긴 그림이 부족한 에너지를 채워줘. 보약 같은 그림이라고 생각하면 돼.`;
            } else {
              hookLine = `${nameKorean || "너"}의 사주는 균형이 좋은 편이야`;
              explainLine = `밸런스가 잡혀 있는데, ${ohNames[yEl]}(${yEl}) 기운을 살짝 더하면 운이 한 단계 업. ${ohVibes[yEl]}를 그림으로 채워보는 거야.`;
            }

            return (
            <div className="space-y-6 animate-fade-in">
              {/* 내 사주 + 추천 요약 */}
              <div className="bg-card border border-primary/20 rounded-2xl p-6 glow-mystical">
                <p className="text-xs text-primary font-medium mb-3">{nameKorean || "나"}님의 사주가 고른 그림</p>
                <p className="text-base font-medium text-foreground leading-relaxed mb-2">{hookLine}</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{explainLine}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <span>내 기운: <span className={`font-semibold ${OHAENG_COLORS[dayOh]?.text}`}>{ohNames[dayOh]}({dayOh})</span> {dayStrength}</span>
                  <span>→</span>
                  <span>필요한 기운: <span className={`font-semibold ${OHAENG_COLORS[yEl]?.text}`}>{ohNames[yEl]}({yEl})</span></span>
                </div>
              </div>

              {/* 추천 작품 그리드 (웹 반응형) */}
              <div>
                <SectionHeader title={`${ohNames[yEl]} 에너지가 담긴 작품`} />
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
                <SectionHeader title="당신의 사주가 선택한 그림 Top 5" onMore={() => navigate("/top-picks")} />
                <div className="space-y-3">
                  {analysis.topCases.map((c, i) => {
                    const el = ELEMENT_MAP[c.element];
                    const en = ENERGY_MAP[c.energy];
                    const st = STYLE_MAP[c.style];
                    const matchArt = (analysis.artworks || []).find(a => a.caseCode === c.caseCode)
                      || (analysis.artworks || []).find(a => a.element === c.element);
                    const artId = matchArt?.id;
                    const rankLabel = i === 0 ? "최적 추천" : `${i + 1}순위`;
                    const funDesc = c.recommendationType === "보완형"
                      ? `부족한 ${el?.labelKor} 기운을 ${en?.labelKor} 에너지의 ${st?.labelKor} 작품으로 채워보세요`
                      : `강한 ${el?.labelKor}을 더 살려줄 ${en?.labelKor} 에너지 — ${st?.labelKor} 스타일이 딱이에요`;
                    return (
                      <div key={c.caseCode}
                        onClick={() => artId && navigate(`/artwork/${artId}`)}
                        className={`bg-card border rounded-xl p-4 flex gap-4 items-center transition-all cursor-pointer hover:border-primary/30 ${i === 0 ? "border-primary/30 glow-mystical" : "border-border"}`}>
                        {/* 섬네일 */}
                        <div className="shrink-0 w-16 h-20 rounded-lg overflow-hidden border border-border">
                          <CaseCodeArt element={c.element} energy={c.energy} style={c.style} />
                        </div>
                        {/* 설명 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-xs font-semibold ${i === 0 ? "text-primary" : "text-foreground"}`}>{rankLabel}</span>
                            <span className="text-[10px] text-muted-foreground">{el?.labelKor} · {en?.labelKor} · {st?.labelKor}</span>
                          </div>
                          <p className="text-xs text-foreground/80">{funDesc}</p>
                          {matchArt && <p className="text-[10px] text-muted-foreground mt-0.5">{matchArt.artist} — {matchArt.title.split("—")[0].trim()}</p>}
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

              {/* 행운 색상 + 아트 스타일 */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <p className="text-sm font-semibold text-foreground mb-5">사주가 추천하는 아트 스타일</p>

                {/* 행운 컬러 */}
                <div className="mb-5">
                  <p className="text-xs text-muted-foreground mb-2">행운 컬러</p>
                  <div className="flex gap-3">
                    {analysis.lucky.colorHexes.map((hex, i) => (
                      <div key={i} className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 border border-border">
                        <div className="w-6 h-6 rounded-full border border-border shrink-0" style={{ backgroundColor: hex }} />
                        <span className="text-xs text-foreground">{analysis.lucky.colors[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 화풍 / 소재 / 분위기 — 이모지 카드 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">추천 화풍</p>
                    <div className="space-y-1.5">
                      {analysis.lucky.artStyles.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 border border-border">
                          <span className="text-base">{s.emoji}</span>
                          <span className="text-xs text-foreground">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">추천 소재</p>
                    <div className="space-y-1.5">
                      {analysis.lucky.artSubjects.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 border border-border">
                          <span className="text-base">{s.emoji}</span>
                          <span className="text-xs text-foreground">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">추천 분위기</p>
                    <div className="space-y-1.5">
                      {analysis.lucky.artMoods.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 border border-border">
                          <span className="text-base">{s.emoji}</span>
                          <span className="text-xs text-foreground">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {analysis.lucky.direction}에 두면 기운이 강해지고, {analysis.lucky.season}에 특히 효과적이에요.
                </p>
              </div>
            </div>
          );
          })()}

          {/* ── MBTI 추천 탭 ── */}
          {subTab === "mbti" && (() => {
            const userMbti = store.mbti || "INFP";
            const mbtiResult = matchMbtiToArt(userMbti);
            const mbtiArtworks = getRecommendedArtworks(mbtiResult.top.slice(0, 8).map(r => r.caseCode), 8);

            return (
              <div className="space-y-6 animate-fade-in">
                {/* MBTI 프로필 */}
                <div className="bg-card border border-primary/20 rounded-2xl p-6 glow-mystical">
                  <p className="text-xs text-primary font-medium mb-2">{nameKorean || "나"}의 MBTI가 고른 그림</p>
                  <p className="text-lg font-bold text-foreground mb-1">{mbtiResult.mbtiLabel}</p>
                  <p className="text-sm text-foreground/80 mb-2">{mbtiResult.personality}</p>
                  <p className="text-sm text-primary/80">{mbtiResult.artVibe}</p>
                </div>

                {/* MBTI 추천 작품 그리드 */}
                <div>
                  <SectionHeader title={`${mbtiResult.mbtiLabel}에게 딱 맞는 그림`} />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {mbtiArtworks.slice(0, 8).map((art) => {
                      const el = ELEMENT_MAP[art.element];
                      const en = ENERGY_MAP[art.energy];
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

                {/* MBTI Top 5 */}
                <div>
                  <SectionHeader title="MBTI 매칭 Top 5" />
                  <div className="space-y-3">
                    {mbtiResult.top.slice(0, 5).map((r, i) => {
                      const el = ELEMENT_MAP[r.element];
                      const en = ENERGY_MAP[r.energy];
                      const st = STYLE_MAP[r.style];
                      const matchArt = mbtiArtworks.find(a => a.caseCode === r.caseCode)
                        || mbtiArtworks.find(a => a.element === r.element);
                      return (
                        <div key={r.caseCode}
                          onClick={() => matchArt && navigate(`/artwork/${matchArt.id}`)}
                          className={`bg-card border rounded-xl p-4 flex gap-4 items-center cursor-pointer hover:border-primary/30 transition-all ${
                            i === 0 ? "border-primary/30 glow-mystical" : "border-border"
                          }`}>
                          <div className="shrink-0 w-16 h-20 rounded-lg overflow-hidden border border-border">
                            <CaseCodeArt element={r.element} energy={r.energy} style={r.style} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-xs font-semibold ${i === 0 ? "text-primary" : "text-foreground"}`}>
                                {i === 0 ? "최적 추천" : `${i + 1}순위`}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{el?.labelKor} · {en?.labelKor} · {st?.labelKor}</span>
                            </div>
                            <p className="text-xs text-foreground/80">
                              {userMbti}의 {i === 0 ? "감성에 가장 잘 맞는" : "성향과 어울리는"} {st?.labelKor} 스타일
                            </p>
                            {matchArt && <p className="text-[10px] text-muted-foreground mt-0.5">{matchArt.artist} — {matchArt.title.split("—")[0].trim()}</p>}
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="text-xl font-bold text-primary">{r.score}</span>
                            <p className="text-[9px] text-muted-foreground">매칭</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── 사주 분석 탭 ── */}
          {subTab === "saju" && (() => {
            const ohN: Record<string, string> = { 목: "나무", 화: "불", 토: "흙", 금: "쇠", 수: "물" };
            const ohPersonality: Record<string, string> = {
              목: "성장하려는 에너지가 강해. 새로운 걸 시작하는 걸 좋아하고, 정 많고 창의적인 편",
              화: "열정적이고 활발해. 표현력이 좋고 사람들 앞에 서는 걸 자연스럽게 해",
              토: "안정적이고 믿음직해. 사람들 사이에서 중심을 잡아주는 역할을 잘 해",
              금: "결단력이 있고 칼 같은 성격. 한번 정하면 안 바꾸고, 의리가 강해",
              수: "생각이 깊고 머리가 좋아. 상황 파악이 빠르고 적응력이 뛰어나",
            };
            const dOh = analysis.enhancedYongsin.dayOhaeng;
            const yOh = analysis.enhancedYongsin.yongsin;
            const hOh = analysis.enhancedYongsin.huisin;
            const gOh = analysis.enhancedYongsin.gisin;
            const dStr = analysis.enhancedYongsin.dayStrength;

            // 오행 밸런스 해설
            const bal = analysis.balance;
            const dominant = (Object.entries(bal) as [string, number][]).filter(([, v]) => v >= 3).map(([k]) => k);
            const lacking = (Object.entries(bal) as [string, number][]).filter(([, v]) => v === 0).map(([k]) => k);
            const balVibes: Record<string, string> = {
              목: "추진력과 성장 에너지",
              화: "열정과 표현력",
              토: "안정감과 현실 감각",
              금: "결단력과 집중력",
              수: "생각의 깊이와 감성",
            };
            let balanceComment = "";
            if (dominant.length > 0) {
              balanceComment += dominant.map(d => `${ohN[d]}(${d})이(가) 많아서 ${balVibes[d]}이 넘침`).join(". ") + ". ";
            }
            if (lacking.length > 0) {
              balanceComment += lacking.map(l => `${ohN[l]}(${l})이(가) 없어서 ${balVibes[l]}을 의식적으로 채워야 함`).join(". ") + ".";
            }
            if (!balanceComment) balanceComment = "오행이 고르게 분포되어 있어서 밸런스가 좋은 편이야.";

            return (
            <div className="space-y-4 animate-fade-in">
              {/* 사주팔자 */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs text-muted-foreground mb-3">내 사주 네 기둥</p>
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
                {/* 사주 한줄 요약 */}
                <p className="text-sm text-foreground/80 leading-relaxed mt-4">
                  {ohN[dOh]}({dOh}) 기운의 사람이야. {ohPersonality[dOh]}. 사주 전체를 보면 {analysis.summary.split('\n')[0].split('—')[1]?.trim() || `${ohN[dOh]} 에너지가 중심인 구조`}
                </p>
              </div>

              {/* 오행 밸런스 */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs text-muted-foreground mb-3">오행 밸런스 — 뭐가 많고 뭐가 부족해?</p>
                <div className="flex gap-2">
                  {(["목", "화", "토", "금", "수"] as const).map((oh) => {
                    const count = bal[oh];
                    const maxCount = Math.max(...Object.values(bal), 1);
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
                {/* 밸런스 해설 */}
                <p className="text-sm text-foreground/80 leading-relaxed mt-3">{balanceComment}</p>
              </div>

              {/* 나한테 필요한 기운 */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs text-muted-foreground mb-2">나한테 필요한 기운</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-lg font-bold ${OHAENG_COLORS[dOh]?.text}`}>{ohN[dOh]}({dOh})</span>
                  <span className="text-sm text-foreground">{dStr === "강" ? "에너지 넘침" : dStr === "약" ? "에너지 부족" : "밸런스 좋음"}</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                  {dStr === "강"
                    ? `${ohN[dOh]} 기운이 강해서 넘치는 에너지를 ${ohN[yOh]}(${yOh})로 분산시켜야 해. ${ohN[yOh]} 기운이 들어오면 과한 ${ohN[dOh]} 에너지가 자연스럽게 정리돼.`
                    : dStr === "약"
                    ? `${ohN[dOh]} 기운이 약한 편이라, ${ohN[yOh]}(${yOh}) 기운으로 힘을 보충해야 해. ${ohN[yOh]} 에너지가 부족한 ${ohN[dOh]}를 살려주는 구조야.`
                    : `밸런스가 좋은 편인데, ${ohN[yOh]}(${yOh}) 기운을 살짝 더하면 운이 한 단계 업돼.`
                  }
                </p>
                <div className="flex gap-3 text-xs">
                  <div className="flex-1 bg-surface rounded-lg p-2.5">
                    <p className="text-muted-foreground mb-0.5">채우면 좋은 기운</p>
                    <p className={`font-semibold ${OHAENG_COLORS[yOh]?.text}`}>{ohN[yOh]}({yOh})</p>
                  </div>
                  <div className="flex-1 bg-surface rounded-lg p-2.5">
                    <p className="text-muted-foreground mb-0.5">도와주는 기운</p>
                    <p className="text-foreground">{ohN[hOh] || hOh}</p>
                  </div>
                  <div className="flex-1 bg-surface rounded-lg p-2.5">
                    <p className="text-muted-foreground mb-0.5">조심할 기운</p>
                    <p className="text-foreground">{ohN[gOh] || gOh}</p>
                  </div>
                </div>
              </div>

              {/* 상세 사주 보기 */}
              <button onClick={() => navigate("/saju")}
                className="w-full py-3 rounded-xl bg-surface border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-1">
                상세 사주 분석 보기 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
          })()}
        </>
      )}

      <TabBar activeTab="home" />
    </PageContainer>
  );
};

const SectionHeader = ({ title, onMore }: { title: string; onMore?: () => void }) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    {onMore && (
      <button onClick={onMore} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5">
        더보기 <ChevronRight className="w-3 h-3" />
      </button>
    )}
  </div>
);

export default HomePage;
