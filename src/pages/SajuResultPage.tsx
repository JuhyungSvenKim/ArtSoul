import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import { getSaju } from "@/lib/saju";
import { getOhaengBalance, getYongsin, getLuckyItems } from "@/lib/saju/analysis";
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

// URL hash 또는 localStorage에서 사주 데이터 읽기
function loadSajuData(): { nameKorean: string; birthDate: string; birthTime: string | null; gender: string } | null {
  // 1순위: URL hash (base64 인코딩)
  try {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const json = decodeURIComponent(atob(hash));
      const d = JSON.parse(json);
      if (d.birthDate && d.gender) return d;
    }
  } catch {}
  // 2순위: localStorage 직접 저장
  try {
    const raw = localStorage.getItem("artsoul-saju-input");
    if (raw) { const d = JSON.parse(raw); if (d.birthDate && d.gender) return d; }
  } catch {}
  // 3순위: zustand persist
  try {
    const raw = localStorage.getItem("artsoul-onboarding");
    if (raw) { const p = JSON.parse(raw); const s = p.state || p; if (s.birthDate && s.gender) return s; }
  } catch {}
  return null;
}

const SajuResultPage = () => {
  const navigate = useNavigate();

  // 동기적으로 초기 렌더 시 데이터 로드 (hooks 의존 없음)
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
      const result = getSaju({
        year: y, month: m, day: d, hour,
        gender: gender === "male" ? "남" : "여",
        calendarType: "양력",
      });

      const balance = getOhaengBalance(result);
      const yongsin = getYongsin(balance, result.ilju.ohaeng);
      const lucky = getLuckyItems(yongsin.element);

      // 125 케이스코드
      const { yeonju, wolju, ilju, siju, sipsung } = result;
      const enhancedYongsin = analyzeYongsin({ yeonju, wolju, ilju, siju }, sipsung);
      const recommendation = matchSajuToCases({
        sajuResult: result,
        yongsinResult: enhancedYongsin,
      });
      const topCase = recommendation.all[0];

      return { result, yongsin, lucky, enhancedYongsin, topCase, balance };
    } catch {
      return null;
    }
  }, [birthDate, birthTime, gender]);

  if (!analysis) {
    return (
      <PageContainer className="items-center justify-center text-center">
        <p className="text-muted-foreground">사주 정보가 없습니다.</p>
        <button onClick={() => navigate("/birth-info")}
          className="mt-4 text-primary text-sm">다시 입력하기</button>
      </PageContainer>
    );
  }

  const { result, yongsin, lucky, enhancedYongsin, topCase, balance } = analysis;
  const ilganOhaeng = result.ilju.ohaeng;
  const ohaengStyle = OHAENG_COLORS[ilganOhaeng] || { bg: "bg-surface", text: "text-foreground" };

  // 공유 텍스트
  const shareText = `[ART.D.N.A.] ${nameKorean || "나"}의 사주 DNA\n일간: ${result.ilju.cheonganKor}(${ilganOhaeng}) · 용신: ${yongsin.element}\n추천 케이스: ${topCase?.caseCode || "-"}\n\n나만의 예술을 찾아보세요!`;
  const shareUrl = window.location.origin;

  // 카카오톡 공유
  const shareKakao = () => {
    const kakao = (window as any).Kakao;
    if (kakao?.Share) {
      kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: `${nameKorean || "나"}의 ART DNA`,
          description: `일간 ${result.ilju.cheonganKor}(${ilganOhaeng}) · 용신 ${yongsin.element} · ${topCase?.caseCode || ""}`,
          imageUrl: `${shareUrl}/pwa-icon.svg`,
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
        buttons: [{ title: "나도 해보기", link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
      });
    } else {
      // 카카오 SDK 미설치 시 클립보드 복사
      navigator.clipboard.writeText(shareText).then(() => alert("결과가 복사되었습니다!"));
    }
  };

  // 인스타 스토리 공유 (딥링크)
  const shareInstagram = () => {
    // 인스타그램은 직접 텍스트 공유가 불가능하므로 클립보드 복사 후 안내
    navigator.clipboard.writeText(shareText).then(() => {
      alert("결과가 복사되었습니다!\n인스타그램 스토리에 붙여넣기 해주세요.");
      // 인스타그램 앱 열기 시도
      window.open("instagram://story-camera", "_blank");
    });
  };

  return (
    <PageContainer className="pb-8">
      {/* 헤더 */}
      <div className="text-center mb-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center glow-gold"
          style={{ backgroundColor: `${ELEMENT_MAP[topCase?.element || 'W']?.color || '#c8a45e'}20` }}>
          <span className="text-2xl font-display font-bold"
            style={{ color: ELEMENT_MAP[topCase?.element || 'W']?.color }}>{result.ilju.cheongan}</span>
        </div>
        <h1 className="text-2xl font-display text-gold-gradient font-semibold">
          {nameKorean || "나"}의 ART DNA
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {result.solarDate.year}.{result.solarDate.month}.{result.solarDate.day} · {result.input.gender} · {result.jeolgiName}
        </p>
      </div>

      {/* 일간 + 용신 요약 */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-12 h-12 rounded-xl ${ohaengStyle.bg} flex items-center justify-center`}>
            <span className={`text-xl font-bold ${ohaengStyle.text}`}>{result.ilju.cheongan}</span>
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              일간 {result.ilju.cheonganKor}({ilganOhaeng}) · {enhancedYongsin.dayStrength}
            </p>
            <p className="text-xs text-muted-foreground">
              용신 <span className={`font-semibold ${OHAENG_COLORS[enhancedYongsin.yongsin]?.text || "text-primary"}`}>{enhancedYongsin.yongsin}</span>
              {" · "}희신 {enhancedYongsin.huisin}
            </p>
          </div>
        </div>
        <p className="text-xs text-foreground/70 leading-relaxed">{enhancedYongsin.summary}</p>
      </div>

      {/* 오행 밸런스 */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4">
        <p className="text-xs text-muted-foreground mb-3">오행 밸런스</p>
        <div className="flex gap-2">
          {(["목", "화", "토", "금", "수"] as const).map((oh) => {
            const count = balance[oh];
            const maxCount = Math.max(...Object.values(balance), 1);
            const style = OHAENG_COLORS[oh];
            return (
              <div key={oh} className="flex-1 text-center">
                <div className="h-20 flex items-end justify-center mb-1">
                  <div className={`w-full rounded-t-lg ${style.bg} transition-all`}
                    style={{ height: `${Math.max((count / maxCount) * 100, 10)}%` }} />
                </div>
                <p className={`text-xs font-bold ${style.text}`}>{oh}</p>
                <p className="text-[10px] text-muted-foreground">{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 추천 ART DNA 코드 */}
      {topCase && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          <p className="text-xs text-muted-foreground mb-2">추천 ART DNA</p>
          <div className="flex items-center gap-3">
            <span className="text-lg font-mono font-bold px-3 py-1 rounded-lg"
              style={{
                backgroundColor: `${ELEMENT_MAP[topCase.element]?.color}20`,
                color: ELEMENT_MAP[topCase.element]?.color,
                border: `1px solid ${ELEMENT_MAP[topCase.element]?.color}40`,
              }}>
              {topCase.caseCode}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                {ELEMENT_MAP[topCase.element]?.labelKor} × {ENERGY_MAP[topCase.energy]?.labelKor} × {STYLE_MAP[topCase.style]?.labelKor}
              </p>
              <p className="text-xs text-muted-foreground">{topCase.reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* 행운 색상 */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <p className="text-xs text-muted-foreground mb-3">행운 컬러</p>
        <div className="flex gap-3">
          {lucky.colorHexes.map((hex, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full border border-border" style={{ backgroundColor: hex }} />
              <span className="text-[10px] text-muted-foreground mt-1">{lucky.colors[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SNS 공유 */}
      <div className="flex gap-3 mb-4">
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

      {/* 메인으로 */}
      <button onClick={() => navigate("/home")}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all active:scale-[0.98] glow-gold">
        메인 화면으로
      </button>
    </PageContainer>
  );
};

export default SajuResultPage;
