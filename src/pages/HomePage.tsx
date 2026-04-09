import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import TabBar from "@/components/TabBar";
import { ChevronRight } from "lucide-react";
import { useOnboardingStore } from "@/stores/onboarding";
import { getSaju } from "@/lib/saju";
import { getYongsin, getOhaengBalance, getLuckyItems } from "@/lib/saju/analysis";

const OHAENG_COLORS: Record<string, string> = {
  목: "text-green-400", 화: "text-red-400", 토: "text-yellow-400", 금: "text-gray-300", 수: "text-blue-400",
};

// 오행별 추천 작품 (데모 데이터 - 나중에 DB에서 가져옴)
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
    { id: "wa1", title: "바다의 숨결", artist: "정은채", emoji: "🌊", reason: "수 기운 보충" },
    { id: "wa2", title: "비 오는 거리", artist: "오현석", emoji: "🌧️", reason: "깊은 사유" },
    { id: "wa3", title: "호수의 새벽", artist: "김수연", emoji: "🏞️", reason: "고요한 지혜" },
    { id: "wa4", title: "수묵 산수", artist: "이도윤", emoji: "⛰️", reason: "유연한 흐름" },
  ],
};

const POPULAR_ARTWORKS = [
  { id: "p1", title: "달빛 아래 소나무", artist: "박서연", emoji: "🌙" },
  { id: "p2", title: "붉은 노을", artist: "이도윤", emoji: "🌅" },
  { id: "p3", title: "정물 — 매화", artist: "최하늘", emoji: "🌸" },
  { id: "p4", title: "바다의 숨결", artist: "정은채", emoji: "🌊" },
];

const NEW_ARTWORKS = [
  { id: "n1", title: "추상 오행도", artist: "한지민", emoji: "✨" },
  { id: "n2", title: "도시의 기운", artist: "오현석", emoji: "🏙️" },
  { id: "n3", title: "수묵 산수", artist: "김태리", emoji: "⛰️" },
  { id: "n4", title: "금빛 정원", artist: "유재석", emoji: "🌻" },
];

const HomePage = () => {
  const navigate = useNavigate();
  const { nameKorean, birthDate, birthTime, gender, mbti } = useOnboardingStore();

  // 사주 기반 추천 데이터 계산
  const personalized = useMemo(() => {
    if (!birthDate || !gender) return null;
    try {
      const [y, m, d] = birthDate.split("-").map(Number);
      const hour = birthTime ? Number(birthTime.split(":")[0]) : 12;
      const result = getSaju({ year: y, month: m, day: d, hour, gender: gender === "male" ? "남" : "여", calendarType: "양력" });
      const balance = getOhaengBalance(result);
      const yongsin = getYongsin(balance, result.ilju.ohaeng);
      const lucky = getLuckyItems(yongsin.element);
      return { result, yongsin, lucky, ilganOhaeng: result.ilju.ohaeng };
    } catch {
      return null;
    }
  }, [birthDate, birthTime, gender]);

  const recommendedArtworks = personalized
    ? OHAENG_ARTWORKS[personalized.yongsin.element] || OHAENG_ARTWORKS["목"]
    : [];

  const matchReason = personalized
    ? `${personalized.yongsin.element} 기운이 부족한 당신에게 ${personalized.yongsin.element}의 에너지를 채워줄 작품`
    : "";

  return (
    <PageContainer className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display text-gold-gradient font-semibold">ART.D.N.A.</h1>
        <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-xs">🔔</div>
      </div>

      {/* 개인화 추천 (사주 데이터 있을 때) */}
      {personalized && recommendedArtworks.length > 0 && (
        <>
          <div className="bg-card border border-border rounded-2xl p-5 mb-5 glow-mystical animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs text-primary font-medium">
                {nameKorean || "회원"}님을 위한 추천
              </p>
              {mbti && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{mbti}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">{matchReason}</p>
            <div className="flex gap-4 items-center">
              <div className="w-20 h-24 rounded-xl bg-surface border border-border flex items-center justify-center text-3xl shrink-0">
                {recommendedArtworks[0].emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium text-foreground truncate">{recommendedArtworks[0].title}</h3>
                <p className="text-xs text-muted-foreground mb-1">{recommendedArtworks[0].artist}</p>
                <span className={`text-xs ${OHAENG_COLORS[personalized.yongsin.element] || ""}`}>
                  {recommendedArtworks[0].reason}
                </span>
              </div>
            </div>
          </div>

          {/* 용신 기반 추천 슬라이더 */}
          <SectionHeader title={`${personalized.yongsin.element} 기운 보충 작품`} />
          <div className="flex gap-3 overflow-x-auto pb-2 mb-6 -mx-1 px-1 scrollbar-hide">
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
        </>
      )}

      {/* 비로그인 시 기본 추천 */}
      {!personalized && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-5 animate-fade-in">
          <p className="text-xs text-primary font-medium mb-2">사주 기반 맞춤 추천</p>
          <p className="text-sm text-muted-foreground mb-3">생년월일을 입력하면 나에게 맞는 그림을 추천해드려요</p>
          <button
            onClick={() => navigate("/birth-info")}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
          >
            사주 입력하고 추천받기
          </button>
        </div>
      )}

      {/* 인기 작품 */}
      <SectionHeader title="인기 작품" />
      <div className="flex gap-3 overflow-x-auto pb-2 mb-6 -mx-1 px-1 scrollbar-hide">
        {POPULAR_ARTWORKS.map((art) => (
          <div key={art.id} className="shrink-0 w-32">
            <div className="w-32 h-40 rounded-xl bg-surface border border-border flex items-center justify-center text-4xl mb-2">
              {art.emoji}
            </div>
            <p className="text-xs font-medium text-foreground truncate">{art.title}</p>
            <p className="text-[10px] text-muted-foreground">{art.artist}</p>
          </div>
        ))}
      </div>

      {/* 새로운 작품 */}
      <SectionHeader title="새로운 작품" />
      <div className="grid grid-cols-2 gap-3 mb-6">
        {NEW_ARTWORKS.map((art) => (
          <div key={art.id} className="group">
            <div className="aspect-[3/4] rounded-xl bg-surface border border-border flex items-center justify-center text-4xl mb-2 transition-all group-hover:border-primary/30">
              {art.emoji}
            </div>
            <p className="text-xs font-medium text-foreground truncate">{art.title}</p>
            <p className="text-[10px] text-muted-foreground">{art.artist}</p>
          </div>
        ))}
      </div>

      {/* 이벤트 배너 */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-primary">🎨 봄맞이 이벤트</p>
          <p className="text-xs text-muted-foreground mt-0.5">첫 렌탈 30% 할인</p>
        </div>
        <ChevronRight className="w-4 h-4 text-primary" />
      </div>

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
