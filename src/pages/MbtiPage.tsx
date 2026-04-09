import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import ProgressBar from "@/components/ProgressBar";
import MbtiGrid, { type MbtiType } from "@/components/MbtiGrid";
import MiniMbtiTest from "@/components/MiniMbtiTest";
import { useOnboardingStore } from "@/stores/onboarding";
import { updateUserMbti } from "@/services/onboarding";

const MbtiPage = () => {
  const navigate = useNavigate();
  const { userId, setMbti: storeMbti } = useOnboardingStore();
  const [mbti, setMbti] = useState<MbtiType | null>(null);
  const [showTest, setShowTest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = async () => {
    if (!mbti) return;
    setSaving(true);
    setError(null);

    try {
      if (userId) {
        await updateUserMbti(userId, mbti);
      }
      storeMbti(mbti);
      navigate("/art-taste");
    } catch (e: any) {
      console.error("Failed to save MBTI:", e);
      setError(e.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
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

      {error && (
        <div className="rounded-lg bg-red-500/20 text-red-400 px-3 py-2 text-xs font-medium mb-4">
          {error}
        </div>
      )}

      <MbtiGrid selected={mbti} onSelect={(t) => { setMbti(t); setShowTest(false); }} />

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">또는</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button
        onClick={() => setShowTest(!showTest)}
        className="w-full py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all mb-4"
      >
        {showTest ? "직접 선택하기" : "모르겠어요 — 간단 테스트"}
      </button>

      <MiniMbtiTest
        visible={showTest}
        onComplete={(result) => {
          setMbti(result);
          setShowTest(false);
        }}
      />

      <div className="flex-1" />

      <button
        disabled={!mbti || saving}
        onClick={handleNext}
        className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm mt-6 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
      >
        {saving ? "저장 중..." : "다음"}
      </button>
      <button
        onClick={() => navigate("/home")}
        className="w-full py-2 text-xs text-muted-foreground hover:text-primary transition-colors mt-2"
      >
        건너뛰고 메인으로 →
      </button>
    </PageContainer>
  );
};

export default MbtiPage;
