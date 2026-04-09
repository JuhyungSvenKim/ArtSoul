import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import CaseCodeArt from "@/components/CaseCodeArt";
import { ChevronLeft } from "lucide-react";
import { useOnboardingStore } from "@/stores/onboarding";
import { getSaju } from "@/lib/saju";
import { getOhaengBalance, getYongsin } from "@/lib/saju/analysis";
import { analyzeYongsin } from "@/lib/saju/yongsin";
import { matchSajuToCases } from "@/lib/case-code";
import { getRecommendedArtworks } from "@/data/sample-artworks";
import { ELEMENT_MAP, ENERGY_MAP, STYLE_MAP } from "@/lib/case-code/types";

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

const TopPicksPage = () => {
  const navigate = useNavigate();
  const store = useOnboardingStore();
  const directData = getSajuInput();

  const birthDate = store.birthDate || directData?.birthDate || '';
  const birthTime = store.birthTime || directData?.birthTime || null;
  const gender = store.gender || directData?.gender || null;

  const data = useMemo(() => {
    if (!birthDate || !gender) return null;
    try {
      const [y, m, d] = birthDate.split("-").map(Number);
      const hour = birthTime ? Number(birthTime.split(":")[0]) : 12;
      const result = getSaju({ year: y, month: m, day: d, hour, gender: gender === "male" ? "남" : "여", calendarType: "양력" });
      const balance = getOhaengBalance(result);
      const { yeonju, wolju, ilju, siju, sipsung } = result;
      const enhanced = analyzeYongsin({ yeonju, wolju, ilju, siju }, sipsung);
      const recommendation = matchSajuToCases({ sajuResult: result, yongsinResult: enhanced });
      const top20 = recommendation.all.slice(0, 20);
      const artworks = getRecommendedArtworks(top20.map(c => c.caseCode), 20);
      return { top20, artworks, yongsin: enhanced.yongsin };
    } catch { return null; }
  }, [birthDate, birthTime, gender]);

  if (!data) {
    return (
      <PageContainer className="pt-20">
        <div className="text-center py-20">
          <p className="text-muted-foreground">사주 정보가 필요합니다</p>
          <button onClick={() => navigate("/birth-info")} className="mt-3 text-primary text-sm">사주 입력하기</button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pt-20 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-display text-gold-gradient font-semibold">사주 매칭 Top 20</h1>
          <p className="text-xs text-muted-foreground">용신 {data.yongsin} 기반 맞춤 추천</p>
        </div>
      </div>

      <div className="space-y-3">
        {data.top20.map((c, i) => {
          const el = ELEMENT_MAP[c.element];
          const en = ENERGY_MAP[c.energy];
          const st = STYLE_MAP[c.style];
          const matchArt = data.artworks.find(a => a.caseCode === c.caseCode)
            || data.artworks.find(a => a.element === c.element);
          const artId = matchArt?.id;
          const rankLabel = i === 0 ? "최적 추천" : `${i + 1}순위`;
          const funDesc = c.recommendationType === "보완형"
            ? `부족한 ${el?.labelKor} 기운을 ${en?.labelKor} 에너지의 ${st?.labelKor} 작품으로 채워보세요`
            : `강한 ${el?.labelKor}을 더 살려줄 ${en?.labelKor} 에너지 — ${st?.labelKor} 스타일이 딱이에요`;

          return (
            <div key={c.caseCode}
              onClick={() => artId && navigate(`/artwork/${artId}`)}
              className={`bg-card border rounded-xl p-4 flex gap-4 items-center transition-all cursor-pointer hover:border-primary/30 ${
                i === 0 ? "border-primary/30 glow-mystical" : "border-border"
              }`}>
              {/* 순위 */}
              <div className={`shrink-0 w-7 text-center ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>
                <span className={`text-sm font-bold ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>{i + 1}</span>
              </div>
              {/* 섬네일 */}
              <div className="shrink-0 w-14 h-18 rounded-lg overflow-hidden border border-border">
                <CaseCodeArt element={c.element} energy={c.energy} style={c.style} />
              </div>
              {/* 설명 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-semibold ${i < 3 ? "text-primary" : "text-foreground"}`}>{rankLabel}</span>
                  <span className="text-[10px] text-muted-foreground">{el?.labelKor} · {en?.labelKor} · {st?.labelKor}</span>
                </div>
                <p className="text-xs text-foreground/80 line-clamp-2">{funDesc}</p>
                {matchArt && <p className="text-[10px] text-muted-foreground mt-0.5">{matchArt.artist} — {matchArt.title.split("—")[0].trim()}</p>}
              </div>
              {/* 점수 */}
              <div className="shrink-0 text-right">
                <span className={`text-lg font-bold ${i < 3 ? "text-primary" : "text-foreground"}`}>{c.totalScore}</span>
                <p className="text-[9px] text-muted-foreground">매칭</p>
              </div>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
};

export default TopPicksPage;
