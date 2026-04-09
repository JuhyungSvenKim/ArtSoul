import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import { getSaju } from "@/lib/saju";
import type { SajuResult, Ganji, SinsalItem } from "@/lib/saju";
import { getOhaengBalance, getYongsin, getLuckyItems, getPillarMeanings } from "@/lib/saju/analysis";
import { analyzeYongsin } from "@/lib/saju/yongsin";
import { matchSajuToCases } from "@/lib/case-code";
import { ELEMENT_MAP, ENERGY_MAP, STYLE_MAP } from "@/lib/case-code/types";
import CaseCodeArt from "@/components/CaseCodeArt";
import { getRecommendedArtworks } from "@/data/sample-artworks";
import type { SampleArtwork } from "@/data/sample-artworks";

const OH_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  목: { bg: "bg-green-500/20", text: "text-green-400", hex: "#4a9e6e" },
  화: { bg: "bg-red-500/20", text: "text-red-400", hex: "#d45050" },
  토: { bg: "bg-yellow-500/20", text: "text-yellow-400", hex: "#c49a3c" },
  금: { bg: "bg-gray-400/20", text: "text-gray-300", hex: "#a0a0a0" },
  수: { bg: "bg-blue-500/20", text: "text-blue-400", hex: "#4a7eb5" },
};

const PILLAR_MEANING: Record<string, string> = {
  연주: "조상·어린 시절",
  월주: "부모·사회성",
  일주: "나 자신·배우자",
  시주: "자녀·말년",
};

// URL hash / localStorage에서 사주 데이터 읽기
function loadSajuData() {
  try { const h = window.location.hash.slice(1); if (h) { const d = JSON.parse(decodeURIComponent(atob(h))); if (d.birthDate && d.gender) return d; } } catch {}
  try { const r = localStorage.getItem("artsoul-saju-input"); if (r) { const d = JSON.parse(r); if (d.birthDate && d.gender) return d; } } catch {}
  try { const r = localStorage.getItem("artsoul-onboarding"); if (r) { const p = JSON.parse(r); const s = p.state || p; if (s.birthDate && s.gender) return s; } } catch {}
  return null;
}

// 재미있는 사주 요약 생성
function generateFunSummary(result: SajuResult, yongsin: any, enhancedYongsin: any): string {
  const day = result.ilju.cheonganKor;
  const oh = result.ilju.ohaeng;
  const strength = enhancedYongsin.dayStrength;
  const yongsinOh = enhancedYongsin.yongsin;

  const ohPersonality: Record<string, string> = {
    목: "나무처럼 곧고 성장을 멈추지 않는 타입이에요. 새로운 도전과 시작에 에너지가 넘치죠.",
    화: "불꽃처럼 열정적이고 사람들의 시선을 끄는 존재감의 소유자! 밝고 따뜻한 에너지가 있어요.",
    토: "대지처럼 묵직한 안정감이 있어요. 주변 사람들이 당신 곁에 있으면 편안함을 느끼죠.",
    금: "결단력과 카리스마의 소유자! 날카로운 판단력으로 핵심을 꿰뚫는 능력이 있어요.",
    수: "물처럼 유연하고 지혜로운 사람이에요. 어떤 상황에서도 흐름을 읽는 직감이 뛰어나죠.",
  };

  const strengthComment = strength === "강"
    ? "에너지가 넘치는 만큼, 그 힘을 잘 분산시키는 것이 행복의 열쇠예요."
    : strength === "약"
    ? "부드러운 내면 속에 숨겨진 잠재력이 있어요. 자신을 더 믿어보세요."
    : "균형 잡힌 사주라 안정적이에요. 살짝만 자극을 주면 폭발적인 시너지가 나올 수 있어요.";

  const yongsinHint = `당신에게 가장 필요한 기운은 '${yongsinOh}'이에요. 이 기운이 담긴 공간과 예술은 당신의 삶에 놀라운 변화를 가져다줄 거예요...`;

  return `${ohPersonality[oh] || ""} ${strengthComment}\n\n${yongsinHint}`;
}

const SajuResultPage = () => {
  const navigate = useNavigate();
  const [data] = useState(() => loadSajuData());
  const nameKorean = data?.nameKorean || '';
  const birthDate = data?.birthDate || '';
  const birthTime = data?.birthTime || null;
  const gender = data?.gender || null;

  const analysis = useMemo(() => {
    if (!birthDate || !gender) return null;
    try {
      const [y, m, d] = birthDate.split("-").map(Number);
      const hour = birthTime ? Number(birthTime.split(":")[0]) : 12;
      const result = getSaju({ year: y, month: m, day: d, hour, gender: gender === "male" ? "남" : "여", calendarType: "양력" });
      const balance = getOhaengBalance(result);
      const yongsin = getYongsin(balance, result.ilju.ohaeng);
      const lucky = getLuckyItems(yongsin.element);
      const { yeonju, wolju, ilju, siju, sipsung } = result;
      const enhancedYongsin = analyzeYongsin({ yeonju, wolju, ilju, siju }, sipsung);
      const recommendation = matchSajuToCases({ sajuResult: result, yongsinResult: enhancedYongsin });
      const topCases = recommendation.all.slice(0, 5);
      const topCase = topCases[0];
      const recommendedArtworks = getRecommendedArtworks(topCases.map(c => c.caseCode), 5);
      return { result, yongsin, lucky, enhancedYongsin, topCase, topCases, recommendedArtworks, balance };
    } catch (e: any) {
      return null;
    }
  }, [birthDate, birthTime, gender]);

  if (!analysis) {
    return (
      <PageContainer className="items-center justify-center text-center gap-4">
        <p className="text-muted-foreground">사주 분석 중 문제가 발생했습니다.</p>
        <button onClick={() => navigate("/birth-info")} className="mt-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm">다시 입력하기</button>
      </PageContainer>
    );
  }

  const { result, yongsin, lucky, enhancedYongsin, topCase, topCases, recommendedArtworks, balance } = analysis;
  const pillars: { label: string; ganji: Ganji }[] = [
    { label: "시주", ganji: result.siju },
    { label: "일주", ganji: result.ilju },
    { label: "월주", ganji: result.wolju },
    { label: "연주", ganji: result.yeonju },
  ];
  const funSummary = generateFunSummary(result, yongsin, enhancedYongsin);
  const shareUrl = window.location.origin;
  const shareText = `[ART.D.N.A.] ${nameKorean || "나"}의 사주 DNA\n${result.ilju.cheongan}${result.ilju.jiji}(${result.ilju.cheonganKor}${result.ilju.jijiKor})\n용신: ${enhancedYongsin.yongsin} · 추천: ${topCase?.caseCode || ""}\n\n나만의 예술을 찾아보세요!`;

  const shareKakao = () => {
    const kakao = (window as any).Kakao;
    if (kakao?.Share) {
      kakao.Share.sendDefault({ objectType: "feed", content: { title: `${nameKorean}의 ART DNA`, description: `일간 ${result.ilju.cheonganKor}(${result.ilju.ohaeng}) · 용신 ${enhancedYongsin.yongsin}`, imageUrl: `${shareUrl}/pwa-icon.svg`, link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }, buttons: [{ title: "나도 해보기", link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }] });
    } else {
      navigator.clipboard.writeText(shareText).then(() => alert("결과가 복사되었습니다!"));
    }
  };

  const shareInstagram = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      alert("결과가 복사되었습니다!\n인스타그램 스토리에 붙여넣기 해주세요.");
      window.open("instagram://story-camera", "_blank");
    });
  };

  return (
    <PageContainer className="pb-8">
      {/* ── 헤더 ── */}
      <div className="text-center mb-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center glow-gold"
          style={{ backgroundColor: `${OH_COLORS[result.ilju.ohaeng]?.hex}25`, border: `2px solid ${OH_COLORS[result.ilju.ohaeng]?.hex}50` }}>
          <span className="text-2xl font-bold" style={{ color: OH_COLORS[result.ilju.ohaeng]?.hex }}>{result.ilju.cheongan}</span>
        </div>
        <h1 className="text-2xl font-display text-gold-gradient font-semibold">{nameKorean || "나"}의 ART DNA</h1>
        <p className="text-sm text-muted-foreground mt-1">{result.solarDate.year}.{result.solarDate.month}.{result.solarDate.day} · {result.input.gender} · {result.jeolgiName}</p>
      </div>

      {/* ── 1. 사주팔자 ── */}
      <section className="bg-card border border-border rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />사주팔자 (四柱八字)
        </h2>
        <div className="grid grid-cols-4 gap-2 text-center mb-4">
          {pillars.map(({ label, ganji }) => {
            const cgColor = OH_COLORS[ganji.ohaeng]?.hex || "#888";
            const jjColor = OH_COLORS[ganji.jijiOhaeng]?.hex || "#888";
            const isDay = label === "일주";
            return (
              <div key={label}>
                <p className={`text-[10px] mb-1.5 ${isDay ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                  {label} {isDay && "★"}
                </p>
                {/* 천간 */}
                <div className="rounded-t-lg py-2.5 border border-b-0" style={{ backgroundColor: `${cgColor}15`, borderColor: `${cgColor}30` }}>
                  <p className="text-2xl font-bold leading-none" style={{ color: cgColor }}>{ganji.cheongan}</p>
                  <p className="text-[10px] mt-1" style={{ color: cgColor, opacity: 0.7 }}>{ganji.cheonganKor}</p>
                </div>
                {/* 지지 */}
                <div className="rounded-b-lg py-2.5 border border-t-0" style={{ backgroundColor: `${jjColor}10`, borderColor: `${jjColor}30` }}>
                  <p className="text-2xl font-bold leading-none" style={{ color: jjColor }}>{ganji.jiji}</p>
                  <p className="text-[10px] mt-1" style={{ color: jjColor, opacity: 0.7 }}>{ganji.jijiKor}</p>
                </div>
                {/* 의미 */}
                <p className="text-[9px] text-muted-foreground mt-1.5">{PILLAR_MEANING[label]}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 2. 오행 밸런스 ── */}
      <section className="bg-card border border-border rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />오행 밸런스
        </h2>
        <div className="flex gap-2 items-end">
          {(["목", "화", "토", "금", "수"] as const).map((oh) => {
            const count = balance[oh];
            const maxCount = Math.max(...Object.values(balance), 1);
            const color = OH_COLORS[oh];
            const pct = Math.max((count / maxCount) * 100, 12);
            return (
              <div key={oh} className="flex-1 text-center">
                <div className="h-24 flex items-end justify-center mb-1">
                  <div className="w-full rounded-t-lg transition-all" style={{ height: `${pct}%`, backgroundColor: `${color.hex}30`, border: `1px solid ${color.hex}40`, borderBottom: "none" }} />
                </div>
                <p className="text-xs font-bold" style={{ color: color.hex }}>{oh}</p>
                <p className="text-[10px] text-muted-foreground">{count}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. 용신 + 신살 ── */}
      <section className="bg-card border border-border rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />용신 · 신살
        </h2>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${OH_COLORS[enhancedYongsin.yongsin]?.hex}20` }}>
            <span className="text-lg font-bold" style={{ color: OH_COLORS[enhancedYongsin.yongsin]?.hex }}>{enhancedYongsin.yongsin}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">용신(用神): {enhancedYongsin.yongsin} · 희신: {enhancedYongsin.huisin}</p>
            <p className="text-xs text-muted-foreground">일간 {enhancedYongsin.dayOhaeng} · {enhancedYongsin.dayStrength} · 기신: {enhancedYongsin.gisin}</p>
          </div>
        </div>
        {/* 신살 태그 */}
        {result.sinsal.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {result.sinsal.slice(0, 8).map((s: SinsalItem, i: number) => (
              <span key={i} className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                s.effect === "positive" ? "bg-green-500/15 text-green-400 border border-green-500/20"
                : s.effect === "negative" ? "bg-red-500/15 text-red-400 border border-red-500/20"
                : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
              }`}>
                {s.name}
                <span className="ml-0.5 opacity-60">({s.position.charAt(0)})</span>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ── 4. 재미있는 요약 ── */}
      <section className="bg-card border border-primary/20 rounded-2xl p-5 mb-4 glow-mystical">
        <h2 className="text-sm font-semibold text-primary mb-3">당신의 사주를 한마디로?</h2>
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{funSummary}</p>
        <p className="text-xs text-primary/70 mt-3 italic">더 깊은 해석은 메인 화면에서 AI 사주 해석으로 확인하세요!</p>
      </section>

      {/* ── 5. 추천 작품 ── */}
      {topCase && (() => {
        const el = ELEMENT_MAP[topCase.element];
        const en = ENERGY_MAP[topCase.energy];
        const st = STYLE_MAP[topCase.style];
        return (
          <section className="bg-card border border-border rounded-2xl p-5 mb-4">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full" />당신의 사주가 부르는 그림
            </h2>
            <p className="text-xs text-foreground/70 mb-3">
              {enhancedYongsin.yongsin} 기운이 부족한 당신에게, {el?.labelKor}의 색감과 {en?.labelKor} 에너지가 사주의 균형을 잡아줄 거예요.
            </p>

            {/* 대표 작품 */}
            <div className="rounded-xl overflow-hidden border border-border mb-3">
              <div className="aspect-[4/3]">
                <CaseCodeArt element={topCase.element} energy={topCase.energy} style={topCase.style} />
              </div>
              <div className="p-3 bg-surface">
                <p className="text-sm font-medium text-foreground">{recommendedArtworks[0]?.title || "추천 작품"}</p>
                <p className="text-xs text-foreground/70 mt-0.5">
                  {el?.labelKor} 계열 · {en?.labelKor} 에너지 · {st?.labelKor} 스타일
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{recommendedArtworks[0]?.artist || ""} · 매칭 {topCase.totalScore}점</p>
              </div>
            </div>

            {/* 추가 추천 3개 */}
            <div className="grid grid-cols-3 gap-2">
              {recommendedArtworks.slice(1, 4).map((art) => {
                const artEl = ELEMENT_MAP[art.element];
                const artEn = ENERGY_MAP[art.energy];
                return (
                  <div key={art.id}>
                    <div className="aspect-square rounded-lg overflow-hidden border border-border mb-1">
                      <CaseCodeArt element={art.element} energy={art.energy} style={art.style} />
                    </div>
                    <p className="text-[10px] font-medium text-foreground truncate">{art.title.split("—")[0].trim()}</p>
                    <p className="text-[9px] text-muted-foreground">{art.artist}</p>
                  </div>
                );
              })}
            </div>

            {/* 이런 그림을 두면 좋아요 — 이모지 태그 */}
            <div className="bg-surface rounded-xl p-3.5 mt-3">
              <p className="text-xs text-primary font-medium mb-2">이런 그림을 두면 좋아요</p>
              <div className="flex flex-wrap gap-1.5">
                {[...lucky.artStyles, ...lucky.artSubjects, ...lucky.artMoods].map((item, i) => (
                  <span key={i} className="text-[11px] bg-card border border-border rounded-full px-2.5 py-1 text-foreground/80">
                    {item.emoji} {item.label}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-foreground/60 mt-2">
                {lucky.direction}에 두면 기운이 강해지고, {lucky.season}에 특히 효과적이에요.
              </p>
            </div>
          </section>
        );
      })()}

      {/* ── 6. 행운 컬러 ── */}
      <section className="bg-card border border-border rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />행운 컬러
        </h2>
        <div className="flex gap-4">
          {lucky.colorHexes.map((hex, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border-2 border-border shadow-lg" style={{ backgroundColor: hex }} />
              <span className="text-[10px] text-muted-foreground mt-1.5">{lucky.colors[i]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── SNS 공유 ── */}
      <div className="flex gap-3 mb-3">
        <button onClick={shareKakao}
          className="flex-1 py-3 rounded-xl bg-[#FEE500] text-[#191919] font-medium text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.45 4.08 3.63 5.17l-.93 3.42c-.08.28.24.5.48.34l4.07-2.68c.25.02.5.04.75.04 4.42 0 8-2.79 8-6.29S13.42 1 9 1z" fill="#191919"/></svg>
          카카오톡
        </button>
        <button onClick={shareInstagram}
          className="flex-1 py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="white"><path d="M8 1.44c2.136 0 2.389.009 3.233.047.78.036 1.204.166 1.486.276.373.145.64.318.92.598.28.28.453.546.598.92.11.282.24.706.276 1.486.038.844.047 1.097.047 3.233s-.009 2.389-.047 3.233c-.036.78-.166 1.204-.276 1.486-.145.373-.318.64-.598.92-.28.28-.546.453-.92.598-.282.11-.706.24-1.486.276-.844.038-1.097.047-3.233.047s-2.389-.009-3.233-.047c-.78-.036-1.204-.166-1.486-.276a2.478 2.478 0 01-.92-.598 2.478 2.478 0 01-.598-.92c-.11-.282-.24-.706-.276-1.486C1.449 10.39 1.44 10.136 1.44 8s.009-2.389.047-3.233c.036-.78.166-1.204.276-1.486.145-.373.318-.64.598-.92.28-.28.546-.453.92-.598.282-.11.706-.24 1.486-.276C5.611 1.449 5.864 1.44 8 1.44zM8 0C5.827 0 5.555.01 4.702.048 3.85.087 3.27.222 2.76.42a3.917 3.917 0 00-1.417.923A3.927 3.927 0 00.42 2.76c-.198.51-.333 1.09-.372 1.942C.01 5.555 0 5.827 0 8s.01 2.445.048 3.298c.039.852.174 1.433.372 1.942.205.526.478.973.923 1.417.444.445.89.719 1.417.923.51.198 1.09.333 1.942.372.853.038 1.125.048 3.298.048s2.445-.01 3.298-.048c.852-.039 1.433-.174 1.942-.372a3.916 3.916 0 001.417-.923c.445-.444.719-.89.923-1.417.198-.51.333-1.09.372-1.942C16 10.445 16 10.173 16 8s-.01-2.445-.048-3.298c-.039-.852-.174-1.433-.372-1.942a3.926 3.926 0 00-.923-1.417A3.911 3.911 0 0013.24.42c-.51-.198-1.09-.333-1.942-.372C10.445.01 10.173 0 8 0zm0 3.892a4.108 4.108 0 100 8.216 4.108 4.108 0 000-8.216zM8 10.667a2.667 2.667 0 110-5.334 2.667 2.667 0 010 5.334zm4.27-7.065a.96.96 0 100 1.92.96.96 0 000-1.92z"/></svg>
          인스타그램
        </button>
      </div>

      {/* ── 메인으로 ── */}
      <button onClick={() => navigate("/home")}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all active:scale-[0.98] glow-gold">
        메인 화면으로
      </button>
    </PageContainer>
  );
};

export default SajuResultPage;
