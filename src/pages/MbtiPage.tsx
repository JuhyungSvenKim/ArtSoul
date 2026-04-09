import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import ProgressBar from "@/components/ProgressBar";
import MbtiGrid, { type MbtiType } from "@/components/MbtiGrid";
import MiniMbtiTest from "@/components/MiniMbtiTest";
import { useOnboardingStore } from "@/stores/onboarding";
import { updateUserMbti } from "@/services/onboarding";

const MbtiPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, setMbti: storeMbti } = useOnboardingStore();
  const [mbti, setMbti] = useState<MbtiType | null>(null);
  const [showTest, setShowTest] = useState(false);

  // 이전 페이지에서 전달받은 사주 데이터 hash
  const sajuHash = location.hash.slice(1);

  const handleNext = () => {
    if (!mbti) return;
    storeMbti(mbti);
    if (userId) updateUserMbti(userId, mbti).catch(() => {});
    // 사주 데이터 hash를 다음 페이지로 전달
    navigate(`/art-taste#${sajuHash}`);
  };

  return (
    <PageContainer>
      <ProgressBar current={2} total={3} />

      <h1 className="text-xl font-display text-gold-gradient font-semibold mb-2">
        MBTI 선택
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        당신의 성격 유형을 알려주세요
      </p>

      <MbtiGrid selected={mbti} onSelect={(t) => { setMbti(t); setShowTest(false); }} />

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">또는</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button onClick={() => setShowTest(!showTest)}
        className="w-full py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all mb-4">
        {showTest ? "직접 선택하기" : "모르겠어요 — 간단 테스트"}
      </button>

      <MiniMbtiTest visible={showTest} onComplete={(result) => { setMbti(result); setShowTest(false); }} />

      <div className="flex-1" />

      <button disabled={!mbti} onClick={handleNext}
        className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm mt-6 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none">
        다음
      </button>
      <button onClick={() => navigate(`/art-taste#${sajuHash}`)}
        className="w-full py-2 text-xs text-muted-foreground hover:text-primary transition-colors mt-2">
        건너뛰기 →
      </button>
    </PageContainer>
  );
};

export default MbtiPage;
