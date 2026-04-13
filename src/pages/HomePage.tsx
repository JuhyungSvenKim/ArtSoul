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
  const [subTab, setSubTab] = useState<"recommend" | "mbti" | "saju" | "mbti-analysis">("recommend");
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
          <div className="flex gap-1 mb-5 bg-surface rounded-xl p-1 overflow-x-auto">
            {([
              { key: "recommend" as const, label: "사주 추천" },
              { key: "saju" as const, label: "사주 분석" },
              { key: "mbti" as const, label: "MBTI 추천" },
              { key: "mbti-analysis" as const, label: "MBTI 분석" },
            ]).map((tab) => (
              <button key={tab.key} onClick={() => setSubTab(tab.key)}
                className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
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
            try {
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
            } catch (e) { return <p className="text-sm text-red-400 py-8 text-center">MBTI 분석 오류: {String(e)}</p>; }
          })()}

          {/* ── MBTI 분석 탭 ── */}
          {subTab === "mbti-analysis" && (() => {
            try {
            const mbti = (store.mbti || "").toUpperCase();
            if (!mbti) return (
              <div className="animate-fade-in text-center py-12">
                <p className="text-lg font-semibold text-foreground mb-2">MBTI를 먼저 입력해주세요</p>
                <button onClick={() => navigate("/mbti")} className="text-sm text-primary hover:underline">MBTI 입력하러 가기</button>
              </div>
            );

            const dims = {
              EI: mbti[0] as "E" | "I",
              SN: mbti[1] as "S" | "N",
              TF: mbti[2] as "T" | "F",
              JP: mbti[3] as "J" | "P",
            };

            const dimInfo: Record<string, { left: string; right: string; lDesc: string; rDesc: string; yours: string; artAngle: string }> = {
              EI: { left: "E 외향", right: "I 내향", lDesc: "사람들과 어울리며 에너지를 얻는 타입", rDesc: "혼자만의 시간에서 에너지를 충전하는 타입", yours: dims.EI === "E" ? "외향적이라 사람들과 함께하는 전시, 대형 작품이 잘 맞아" : "내향적이라 조용히 감상할 수 있는 작품, 개인 공간에 어울리는 그림이 딱", artAngle: dims.EI === "E" ? "역동적이고 시선을 사로잡는 대담한 작품" : "여백이 있고 사색적인 분위기의 작품" },
              SN: { left: "S 감각", right: "N 직관", lDesc: "현실적이고 구체적인 것을 선호", rDesc: "추상적이고 상상력이 풍부한 것을 선호", yours: dims.SN === "S" ? "사실적이고 디테일한 작품에 끌려. 풍경화, 정물화가 잘 맞아" : "추상적이고 상징적인 작품에 끌려. 컨셉추얼 아트가 잘 맞아", artAngle: dims.SN === "S" ? "세밀한 표현과 사실적 묘사" : "상상력 자극하는 추상·컨셉 작품" },
              TF: { left: "T 사고", right: "F 감정", lDesc: "논리와 분석으로 판단하는 타입", rDesc: "감정과 가치로 판단하는 타입", yours: dims.TF === "T" ? "구조적이고 지적 자극이 있는 작품을 좋아해. 기하학, 미니멀이 딱" : "감성적이고 따뜻한 작품에 마음이 가. 부드러운 색감과 감정이 담긴 그림", artAngle: dims.TF === "T" ? "구조적이고 지적인 미니멀·기하학 작품" : "감성적이고 따뜻한 색감의 작품" },
              JP: { left: "J 판단", right: "P 인식", lDesc: "계획적이고 체계적인 것을 좋아함", rDesc: "유연하고 즉흥적인 것을 좋아함", yours: dims.JP === "J" ? "정돈되고 균형 잡힌 작품이 편안해. 클래식하고 격식 있는 스타일" : "자유롭고 파격적인 작품에 끌려. 즉흥적 에너지가 담긴 스타일", artAngle: dims.JP === "J" ? "균형 잡힌 구도와 클래식한 품위" : "자유로운 구도와 즉흥적 에너지" },
            };

            const personalities: Record<string, { title: string; nickname: string; core: string; strength: string; weakness: string; artSoul: string }> = {
              INTJ: { title: "전략가", nickname: "미래를 설계하는 건축가", core: "독립적이고 분석적. 큰 그림을 보는 능력이 뛰어남", strength: "계획력, 통찰력, 독립심", weakness: "감정 표현 서툴고 완벽주의 과함", artSoul: "미니멀하고 구조적인 작품, 차가운 톤의 추상화. 지적 자극이 있는 작품에 오래 머무는 타입" },
              INTP: { title: "논리학자", nickname: "끝없이 파고드는 탐구자", core: "호기심 덩어리. 이론과 패턴을 사랑하는 사색가", strength: "분석력, 창의력, 객관성", weakness: "실행력 부족, 사회성 약함", artSoul: "실험적이고 개념적인 작품, 기하학적 패턴. 왜 이 작품인지 이유가 명확해야 마음에 듬" },
              ENTJ: { title: "통솔자", nickname: "타고난 리더", core: "야심차고 결단력 있는 리더. 비효율을 참지 못함", strength: "리더십, 추진력, 자신감", weakness: "독단적, 감정 무시 경향", artSoul: "대담하고 임팩트 있는 대형 작품. 공간을 지배하는 강렬한 색감이 딱" },
              ENTP: { title: "변론가", nickname: "아이디어 폭풍의 주인공", core: "재치 있고 도전적. 틀을 깨는 사고방식", strength: "창의력, 적응력, 토론 능력", weakness: "끈기 부족, 갈등 유발", artSoul: "파격적이고 유니크한 작품, 팝아트나 컨템포러리. 남들이 안 고르는 걸 고름" },
              INFJ: { title: "옹호자", nickname: "조용한 이상주의자", core: "깊은 통찰력과 공감 능력. 의미 있는 삶을 추구", strength: "공감력, 통찰력, 헌신", weakness: "번아웃 잦음, 이상 과도", artSoul: "서사가 있고 깊이 있는 작품, 동양적 여백. 작품 뒤의 이야기에 감동받는 타입" },
              INFP: { title: "중재자", nickname: "꿈꾸는 감성 예술가", core: "감성적이고 이상을 추구. 자기만의 세계가 확실함", strength: "창의력, 공감력, 진정성", weakness: "현실 감각 부족, 결정 어려움", artSoul: "따뜻하고 감성적인 작품, 자연 풍경이나 부드러운 수채화. 감정이 움직이는 작품에 끌림" },
              ENFJ: { title: "선도자", nickname: "사람을 이끄는 카리스마", core: "카리스마 있고 영감을 주는 타입. 사람 중심 사고", strength: "리더십, 소통력, 영향력", weakness: "자기 희생 과도, 갈등 회피", artSoul: "따뜻하면서 존재감 있는 작품. 사람들과 공유하고 싶은 의미 있는 그림" },
              ENFP: { title: "활동가", nickname: "열정 가득한 자유영혼", core: "열정적이고 사교적. 가능성을 보는 낙관주의자", strength: "열정, 창의력, 사교성", weakness: "산만함, 현실 도피", artSoul: "밝고 자유로운 작품, 다채로운 색감. 보기만 해도 기분이 좋아지는 에너지 넘치는 그림" },
              ISTJ: { title: "현실주의자", nickname: "믿을 수 있는 기둥", core: "책임감 강하고 성실. 규칙과 전통을 존중", strength: "신뢰성, 책임감, 꼼꼼함", weakness: "변화 거부, 융통성 부족", artSoul: "클래식하고 품위 있는 작품, 사실주의 회화. 오래 봐도 질리지 않는 전통의 가치" },
              ISFJ: { title: "수호자", nickname: "따뜻한 울타리", core: "따뜻하고 헌신적. 주변 사람을 챙기는 게 본능", strength: "헌신, 관찰력, 인내심", weakness: "자기 주장 약함, 변화 두려움", artSoul: "포근하고 편안한 작품, 꽃이나 자연. 집에 두면 마음이 편해지는 그림" },
              ESTJ: { title: "경영자", nickname: "질서의 수호자", core: "조직적이고 실용적. 효율과 규칙을 중시", strength: "조직력, 실행력, 책임감", weakness: "고집, 감정 무시", artSoul: "정돈되고 격식 있는 작품, 고전 미술. 품격 있는 인테리어 아트" },
              ESFJ: { title: "영사", nickname: "모두의 친구", core: "사교적이고 배려심 넘침. 조화와 화합을 추구", strength: "친화력, 배려, 조직력", weakness: "타인 의식 과도, 갈등 회피", artSoul: "누구나 좋아할 수 있는 대중적 작품. 꽃, 풍경 등 공간을 밝히는 그림" },
              ISTP: { title: "장인", nickname: "쿨한 해결사", core: "관찰력 있고 실용적. 손으로 만드는 것을 좋아함", strength: "문제해결, 적응력, 실용성", weakness: "감정 표현 서툴, 장기 계획 약함", artSoul: "질감이 느껴지는 작품, 미니멀하면서 기술적으로 뛰어난 것. 디테일에 감탄하는 타입" },
              ISFP: { title: "모험가", nickname: "타고난 예술 감각", core: "감각적이고 자유로운 영혼. 아름다움에 민감", strength: "미적 감각, 유연성, 감성", weakness: "계획 부족, 갈등 회피", artSoul: "색채가 풍부하고 감각적인 작품. 자연 주제, 꽃, 풍경 — 본능적으로 아름다운 것에 끌림" },
              ESTP: { title: "사업가", nickname: "현장의 승부사", core: "대담하고 활동적. 현실 감각이 뛰어남", strength: "대담함, 관찰력, 순발력", weakness: "인내심 부족, 장기 비전 약함", artSoul: "강렬하고 눈에 띄는 팝아트, 대담한 그래픽. 한 방에 시선을 잡는 작품" },
              ESFP: { title: "연예인", nickname: "분위기 메이커", core: "즉흥적이고 에너지 넘침. 재미와 즐거움 추구", strength: "사교성, 낙관, 즉흥 대응", weakness: "산만, 진지함 부족", artSoul: "화려하고 비비드한 팝 스타일. 보는 순간 기분이 올라가는 에너지 넘치는 작품" },
            };

            const p = personalities[mbti] || { title: mbti, nickname: "", core: "", strength: "", weakness: "", artSoul: "" };

            // 사주 × MBTI 교차 분석
            let crossAnalysis = "";
            if (analysis) {
              const dOh = analysis.enhancedYongsin.dayOhaeng;
              const ohMbtiMap: Record<string, string> = {
                목: dims.EI === "E" ? "외향적 목 기운이라 확장하려는 에너지가 매우 강해. 새로운 프로젝트를 자꾸 벌리는 타입" : "내향적 목 기운이라 내면에서 조용히 성장하는 스타일. 혼자만의 창작이 잘 맞아",
                화: dims.TF === "F" ? "감정형+화 기운이라 열정과 공감이 폭발하는 조합. 사람들에게 영감을 주는 존재" : "사고형+화 기운이라 열정은 있는데 이성적으로 통제하는 타입. 전략적 리더",
                토: dims.JP === "J" ? "판단형+토 기운이라 안정감의 극치. 체계적이고 변하지 않는 신뢰의 상징" : "인식형+토 기운이라 유연한 안정감. 적응하면서도 중심을 잃지 않는 타입",
                금: dims.SN === "S" ? "감각형+금 기운이라 디테일에 강한 완벽주의자. 현실적이면서 칼 같은 판단력" : "직관형+금 기운이라 날카로운 통찰력. 본질을 꿰뚫는 능력이 탁월",
                수: dims.EI === "I" ? "내향적+수 기운이라 깊은 사색가. 혼자 있을 때 가장 창의적인 아이디어가 나옴" : "외향적+수 기운이라 유연한 소통가. 어떤 상황이든 물처럼 적응하는 능력",
              };
              crossAnalysis = ohMbtiMap[dOh] || "";
            }

            return (
              <div className="space-y-4 animate-fade-in">
                {/* MBTI 프로필 카드 */}
                <div className="bg-card border border-primary/20 rounded-2xl p-5 glow-mystical">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">{mbti}</span>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{p.title}</p>
                      <p className="text-sm text-primary">{p.nickname}</p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed mb-2">{p.core}</p>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{p.strength}</span>
                    <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{p.weakness}</span>
                  </div>
                </div>

                {/* 4가지 차원 분석 */}
                <div className="space-y-2">
                  {(["EI", "SN", "TF", "JP"] as const).map(dim => {
                    const info = dimInfo[dim];
                    const isLeft = dim === "EI" ? dims.EI === "E" : dim === "SN" ? dims.SN === "S" : dim === "TF" ? dims.TF === "T" : dims.JP === "J";
                    return (
                      <div key={dim} className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${isLeft ? "bg-primary/10 text-primary" : "bg-surface text-muted-foreground"}`}>{info.left}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-surface relative">
                            <div className={`absolute top-0 h-full rounded-full bg-primary/60 ${isLeft ? "left-0 w-3/4" : "right-0 w-3/4"}`} />
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${!isLeft ? "bg-primary/10 text-primary" : "bg-surface text-muted-foreground"}`}>{info.right}</span>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed">{info.yours}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">추천 아트: {info.artAngle}</p>
                      </div>
                    );
                  })}
                </div>

                {/* 아트 소울 */}
                <div className="bg-card border border-primary/20 rounded-xl p-4">
                  <p className="text-xs text-primary font-medium mb-2">{mbti}의 아트 소울</p>
                  <p className="text-sm text-foreground/85 leading-relaxed">{p.artSoul}</p>
                </div>

                {/* 사주 × MBTI 교차 분석 */}
                {crossAnalysis && (
                  <div className="bg-card border border-primary/20 rounded-xl p-4">
                    <p className="text-xs text-primary font-medium mb-2">사주 × MBTI 크로스 분석</p>
                    <p className="text-sm text-foreground/85 leading-relaxed">{crossAnalysis}</p>
                  </div>
                )}
              </div>
            );
            } catch (e) { return <p className="text-sm text-red-400 py-8 text-center">MBTI 분석 오류: {String(e)}</p>; }
          })()}

          {/* ── 사주 분석 탭 ── */}
          {subTab === "saju" && (() => {
            try {
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
          } catch (e) { return <p className="text-sm text-red-400 py-8 text-center">사주 분석 오류: {String(e)}</p>; }
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
