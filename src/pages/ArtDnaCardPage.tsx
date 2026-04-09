import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import { useOnboardingStore } from "@/stores/onboarding";
import { completeOnboarding } from "@/services/onboarding";
import { getSaju } from "@/lib/saju";
import { getOhaengBalance, getOhaengAnalysis, getYongsin, getLuckyItems } from "@/lib/saju/analysis";

const OHAENG_COLORS: Record<string, { bg: string; text: string }> = {
  목: { bg: "bg-green-500/20", text: "text-green-400" },
  화: { bg: "bg-red-500/20", text: "text-red-400" },
  토: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  금: { bg: "bg-gray-400/20", text: "text-gray-300" },
  수: { bg: "bg-blue-500/20", text: "text-blue-400" },
};

const ArtDnaCardPage = () => {
  const navigate = useNavigate();
  const { userId, nameKorean, birthDate, birthTime, gender, mbti, resetTaste } = useOnboardingStore();
  const [showShareModal, setShowShareModal] = useState(false);

  const displayName = nameKorean || "사용자";

  // 사주 엔진 실행
  const sajuResult = useMemo(() => {
    if (!birthDate || !gender) return null;
    try {
      const [y, m, d] = birthDate.split("-").map(Number);
      const hour = birthTime ? Number(birthTime.split(":")[0]) : 12;
      return getSaju({
        year: y, month: m, day: d, hour,
        gender: gender === "male" ? "남" : "여",
        calendarType: "양력",
      });
    } catch {
      return null;
    }
  }, [birthDate, birthTime, gender]);

  const balance = sajuResult ? getOhaengBalance(sajuResult) : null;
  const analysis = balance ? getOhaengAnalysis(balance, `${sajuResult!.ilju.cheonganKor}(${sajuResult!.ilju.ohaeng})`) : null;
  const yongsin = balance ? getYongsin(balance, sajuResult!.ilju.ohaeng) : null;
  const lucky = yongsin ? getLuckyItems(yongsin.element) : null;

  const ilganElement = sajuResult?.ilju.ohaeng || "목";
  const ilganHanja = sajuResult?.ilju.cheongan || "甲";
  const ilganKor = sajuResult?.ilju.cheonganKor || "갑";
  const gyeokguk = sajuResult?.gyeokguk;

  const elementStyle = OHAENG_COLORS[ilganElement] || OHAENG_COLORS["목"];

  const handleGoHome = async () => {
    try {
      if (userId) await completeOnboarding(userId);
    } catch {}
    resetTaste();
    navigate("/home");
  };

  const handleShare = (platform: "kakao" | "instagram") => {
    // 실제 공유 API 연동 전까지 안내 모달
    setShowShareModal(true);
  };

  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <PageContainer className="items-center">
      {/* 사주 결과 카드 */}
      <div className="w-full bg-card border border-border rounded-2xl p-6 glow-mystical animate-fade-in">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full ${elementStyle.bg} border border-border flex items-center justify-center`}>
            <span className={`text-xl font-bold ${elementStyle.text}`}>{ilganHanja}</span>
          </div>
          <div>
            <h2 className="text-lg font-display text-gold-gradient font-semibold">{displayName}</h2>
            <p className="text-xs text-muted-foreground">
              일간 {ilganKor}({ilganElement}) · {gyeokguk?.name || ""}
              {mbti && ` · ${mbti}`}
            </p>
          </div>
        </div>

        {/* 사주 4주 미니 */}
        {sajuResult && (
          <div className="flex gap-1.5 mb-5">
            {[
              { label: "시", g: sajuResult.siju },
              { label: "일", g: sajuResult.ilju },
              { label: "월", g: sajuResult.wolju },
              { label: "연", g: sajuResult.yeonju },
            ].map(({ label, g }) => {
              const cgS = OHAENG_COLORS[g.ohaeng] || OHAENG_COLORS["목"];
              const jjS = OHAENG_COLORS[g.jijiOhaeng] || OHAENG_COLORS["목"];
              return (
                <div key={label} className="flex-1 text-center">
                  <p className="text-[9px] text-muted-foreground mb-1">{label}</p>
                  <div className={`${cgS.bg} rounded-md py-1`}>
                    <p className={`text-base font-bold ${cgS.text}`}>{g.cheongan}</p>
                  </div>
                  <div className={`${jjS.bg} rounded-md py-1 mt-0.5`}>
                    <p className={`text-base font-bold ${jjS.text}`}>{g.jiji}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 오행 밸런스 바 */}
        {balance && (
          <div className="mb-5">
            <p className="text-xs text-muted-foreground mb-2">오행 밸런스</p>
            <div className="flex gap-1">
              {(Object.entries(balance) as [string, number][]).map(([oh, count]) => {
                const s = OHAENG_COLORS[oh] || OHAENG_COLORS["목"];
                return (
                  <div key={oh} className="flex-1 text-center">
                    <div className={`${s.bg} rounded-md py-1.5`}>
                      <span className={`text-sm font-bold ${s.text}`}>{count}</span>
                    </div>
                    <p className={`text-[9px] mt-0.5 ${s.text}`}>{oh}</p>
                  </div>
                );
              })}
            </div>
            {analysis && (
              <p className="text-xs text-muted-foreground mt-2">{analysis.description}</p>
            )}
          </div>
        )}

        {/* 용신 + 추천 */}
        {yongsin && lucky && (
          <div className="mb-5">
            <p className="text-xs text-muted-foreground mb-2">
              용신: <span className={OHAENG_COLORS[yongsin.element]?.text || ""}>{yongsin.element}</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {lucky.artStyles.map((s) => (
                <span key={s} className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary">
                  {s}
                </span>
              ))}
            </div>
            <div className="flex gap-1.5 mt-2">
              {lucky.colorHexes.map((hex, i) => (
                <div key={i} className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: hex }} />
              ))}
            </div>
          </div>
        )}

        {/* 격국 한줄 */}
        {gyeokguk && (
          <p className="text-sm text-foreground/80 leading-relaxed border-l-2 border-primary/40 pl-3 mb-4">
            {gyeokguk.description}
          </p>
        )}

        <p className="text-[10px] text-muted-foreground text-center">{today} 생성 · ART.D.N.A.</p>
      </div>

      {/* 공유 버튼 */}
      <div className="flex gap-3 w-full mt-6">
        <button
          onClick={() => handleShare("kakao")}
          className="flex-1 py-3 rounded-lg bg-[#FEE500] text-[#191919] text-sm font-medium transition-transform active:scale-[0.98]"
        >
          카카오 공유
        </button>
        <button
          onClick={() => handleShare("instagram")}
          className="flex-1 py-3 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white text-sm font-medium transition-transform active:scale-[0.98]"
        >
          인스타 공유
        </button>
      </div>

      <button
        onClick={handleGoHome}
        className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm mt-3 transition-all active:scale-[0.98]"
      >
        내 사주에 맞는 그림 보러가기 →
      </button>

      {/* 공유 준비중 모달 */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowShareModal(false)} />
          <div className="relative z-10 mx-6 w-full max-w-sm bg-card border border-border rounded-2xl p-6 text-center">
            <p className="text-2xl mb-3">📤</p>
            <h3 className="text-base font-semibold text-foreground mb-2">공유 기능 준비 중</h3>
            <p className="text-sm text-muted-foreground mb-4">
              카카오/인스타그램 공유 기능이 곧 추가됩니다!
            </p>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default ArtDnaCardPage;
