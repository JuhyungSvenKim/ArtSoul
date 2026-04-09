import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import ProgressBar from "@/components/ProgressBar";
import { useOnboardingStore } from "@/stores/onboarding";
import { saveTasteSelections } from "@/services/onboarding";

interface ArtworkPair {
  a: { id: string; title: string; emoji: string };
  b: { id: string; title: string; emoji: string };
}

const PAIRS: ArtworkPair[] = [
  { a: { id: "1a", title: "고요한 산수화", emoji: "🏔️" }, b: { id: "1b", title: "화려한 꽃 정물", emoji: "🌺" } },
  { a: { id: "2a", title: "추상 표현주의", emoji: "🎨" }, b: { id: "2b", title: "정밀한 사실주의", emoji: "📷" } },
  { a: { id: "3a", title: "따뜻한 난색 계열", emoji: "🔥" }, b: { id: "3b", title: "차가운 한색 계열", emoji: "❄️" } },
  { a: { id: "4a", title: "미니멀 구성", emoji: "⬜" }, b: { id: "4b", title: "풍부한 디테일", emoji: "🖼️" } },
  { a: { id: "5a", title: "동양적 여백미", emoji: "🎋" }, b: { id: "5b", title: "서양적 명암법", emoji: "🌗" } },
];

const ArtTastePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, addTasteSelection } = useOnboardingStore();
  const [round, setRound] = useState(0);
  const [selections, setSelections] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // 이전 페이지에서 전달받은 사주 데이터 hash
  const sajuHash = location.hash.slice(1);

  const isLastRound = round >= PAIRS.length - 1;
  const currentPair = PAIRS[round];

  const goToResult = () => {
    // hash가 있으면 그대로 전달, 없으면 localStorage에서 읽어서 만들기
    let hash = sajuHash;
    if (!hash) {
      try {
        const raw = localStorage.getItem("artsoul-saju-input");
        if (raw) hash = btoa(encodeURIComponent(raw));
      } catch {}
    }
    navigate(`/result#${hash}`);
  };

  const handleSelect = async (artworkId: string) => {
    const newSelections = [...selections, artworkId];
    setSelections(newSelections);
    addTasteSelection(artworkId);

    if (isLastRound) {
      setSaving(true);
      try { if (userId) await saveTasteSelections(userId, newSelections); } catch {}
      setSaving(false);
      setTimeout(goToResult, 400);
    } else {
      setTimeout(() => setRound(round + 1), 300);
    }
  };

  const handleSkip = () => {
    if (isLastRound) {
      goToResult();
    } else {
      setRound(round + 1);
    }
  };

  return (
    <PageContainer>
      <ProgressBar current={3} total={3} />

      <h1 className="text-xl font-display text-gold-gradient font-semibold mb-2">
        미술 취향 테스트
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Round {round + 1}/{PAIRS.length} — 끌리는 쪽을 선택하세요
      </p>

      {saving && (
        <div className="rounded-lg bg-yellow-500/20 text-yellow-400 px-3 py-2 text-xs font-medium mb-4">
          저장 중...
        </div>
      )}

      {currentPair && (
        <div className="flex gap-3 animate-fade-in" key={round}>
          {[currentPair.a, currentPair.b].map((artwork) => (
            <button key={artwork.id} onClick={() => handleSelect(artwork.id)} disabled={saving}
              className="flex-1 aspect-[3/4] rounded-xl bg-surface border border-border flex flex-col items-center justify-center gap-3 transition-all hover:border-primary/50 hover:glow-gold active:scale-[0.97] disabled:opacity-50">
              <span className="text-5xl">{artwork.emoji}</span>
              <span className="text-xs text-muted-foreground px-2 text-center leading-relaxed">{artwork.title}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1" />

      <button onClick={handleSkip}
        className="w-full py-2 text-xs text-muted-foreground hover:text-primary transition-colors mt-6">
        {isLastRound ? "건너뛰고 결과 보기 →" : "건너뛰기 →"}
      </button>
    </PageContainer>
  );
};

export default ArtTastePage;
