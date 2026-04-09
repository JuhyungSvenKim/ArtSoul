import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import TabBar from "@/components/TabBar";
import { Settings, ChevronRight, ShieldCheck } from "lucide-react";
import { useOnboardingStore } from "@/stores/onboarding";
import { getCoinBalance } from "@/services/coins";

const MOCK_USER = {
  nickname: "홍길동",
  mbti: "INFP",
  ohaeng: "木",
  avatar: "🧑‍🎨",
};

const MOCK_LIKED = [
  { id: "1", title: "청산유수", artist: "김민수", emoji: "🏔️" },
  { id: "2", title: "봄의 서곡", artist: "박서연", emoji: "🌷" },
  { id: "3", title: "해조음", artist: "최하늘", emoji: "🌊" },
  { id: "4", title: "묵란도", artist: "한지민", emoji: "🎋" },
];

const MOCK_ORDERS = [
  { id: "o1", title: "달빛 아래 소나무", date: "2026.03.28", status: "배송완료", amount: 180000 },
  { id: "o2", title: "봄의 서곡", date: "2026.04.01", status: "렌탈중", amount: 25000 },
];

const MyPage = () => {
  const navigate = useNavigate();
  const { nameKorean, mbti, userId } = useOnboardingStore();
  const [coins, setCoins] = useState<number | null>(null);

  useEffect(() => {
    if (userId) {
      getCoinBalance(userId).then(setCoins).catch(() => {});
    }
  }, [userId]);

  const displayName = nameKorean || MOCK_USER.nickname;
  const displayMbti = mbti || MOCK_USER.mbti;

  return (
    <PageContainer className="pb-24">
      {/* Profile */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center text-2xl">
            {MOCK_USER.avatar}
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">{displayName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] text-primary font-medium">
                {displayMbti}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface border border-border text-[10px] text-muted-foreground font-medium">
                {MOCK_USER.ohaeng}행
              </span>
              {coins !== null && (
                <button
                  onClick={() => navigate('/coin-shop')}
                  className="px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[10px] text-yellow-400 font-medium hover:bg-yellow-500/20 transition-colors"
                >
                  {coins} 🪙 충전
                </button>
              )}
            </div>
          </div>
        </div>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* PASS 본인인증 */}
      <div className="w-full bg-surface border border-border rounded-xl p-4 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">본인인증</p>
            <p className="text-[10px] text-muted-foreground">PASS 본인인증으로 계정을 보호하세요</p>
          </div>
        </div>
        <button onClick={async () => {
          if (!userId) return;
          try {
            const res = await fetch("/api/auth/verify-identity", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "request", userId }),
            });
            const data = await res.json();
            if (data.verified) {
              alert("본인인증이 완료되었습니다!");
            } else if (data.mode === "production" && data.verificationUrl) {
              window.open(data.verificationUrl, "_blank", "width=500,height=600");
            }
          } catch {
            alert("인증 요청 실패");
          }
        }} className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium hover:bg-primary/20 transition-colors">
          인증하기
        </button>
      </div>

      {/* Artist Mode */}
      <button
        onClick={() => navigate("/artist-register")}
        className="w-full bg-surface border border-border rounded-xl p-4 mb-6 flex items-center justify-between text-left"
      >
        <div>
          <p className="text-sm font-medium text-foreground">작가 모드</p>
          <p className="text-xs text-muted-foreground mt-0.5">작품을 등록하고 판매하세요</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Liked Artworks */}
      <SectionHeader title="좋아한 작품" count={MOCK_LIKED.length} />
      <div className="grid grid-cols-2 gap-3 mb-6">
        {MOCK_LIKED.map((art) => (
          <div key={art.id} className="group">
            <div className="aspect-[3/4] rounded-xl bg-surface border border-border flex items-center justify-center text-4xl mb-2 transition-all group-hover:border-primary/30">
              {art.emoji}
            </div>
            <p className="text-xs font-medium text-foreground truncate">{art.title}</p>
            <p className="text-[10px] text-muted-foreground">{art.artist}</p>
          </div>
        ))}
      </div>

      {/* Orders */}
      <SectionHeader title="주문 내역" count={MOCK_ORDERS.length} />
      <div className="space-y-2 mb-6">
        {MOCK_ORDERS.map((order) => (
          <div key={order.id} className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center text-lg shrink-0">
              🖼️
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{order.title}</p>
              <p className="text-[10px] text-muted-foreground">{order.date}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-[10px] font-medium ${order.status === "렌탈중" ? "text-primary" : "text-muted-foreground"}`}>
                {order.status}
              </p>
              <p className="text-xs text-foreground">{order.amount.toLocaleString()}원</p>
            </div>
          </div>
        ))}
      </div>

      {/* Rental */}
      <SectionHeader title="렌탈 현황" />
      <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
        <div className="w-16 h-16 rounded-xl bg-surface border border-border flex items-center justify-center text-3xl shrink-0">
          🌷
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-foreground">봄의 서곡</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">다음 교체일: 2026.05.01</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-[10px] text-primary font-medium">
            이용중
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>

      <TabBar activeTab="my" />
    </PageContainer>
  );
};

const SectionHeader = ({ title, count }: { title: string; count?: number }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-1.5">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
    </div>
    <button className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5">
      더보기 <ChevronRight className="w-3 h-3" />
    </button>
  </div>
);

export default MyPage;
