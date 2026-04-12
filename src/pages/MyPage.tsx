import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import TabBar from "@/components/TabBar";
import CaseCodeArt from "@/components/CaseCodeArt";
import { Settings, ChevronRight, ShieldCheck, Palette, Clock, CheckCircle } from "lucide-react";
import { useOnboardingStore } from "@/stores/onboarding";
import { getCoinBalance } from "@/services/coins";
import { getLikes, type LikedArtwork } from "@/lib/likes";
import { getOrders, getRentals, type Order, type Rental } from "@/lib/orders";
import { supabase } from "@/lib/supabase";

const MOCK_USER = {
  nickname: "홍길동",
  mbti: "INFP",
  ohaeng: "木",
  avatar: "🧑‍🎨",
};

const MyPage = () => {
  const navigate = useNavigate();
  const { nameKorean, mbti, userId } = useOnboardingStore();
  const [coins, setCoins] = useState<number | null>(null);
  const [likes, setLikes] = useState<LikedArtwork[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);

  useEffect(() => {
    if (userId) { getCoinBalance(userId).then(setCoins).catch(() => {}); }
    setLikes(getLikes());
    setOrders(getOrders());
    setRentals(getRentals());
  }, [userId]);

  const displayName = nameKorean || MOCK_USER.nickname;
  const displayMbti = mbti || MOCK_USER.mbti;

  return (
    <PageContainer className="pt-20">
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
        <button onClick={() => {
          if (!confirm("로그아웃 하시겠습니까?")) return;
          localStorage.clear();
          supabase.auth.signOut().catch(() => {});
          navigate("/");
        }} className="p-2 text-muted-foreground hover:text-red-400 transition-colors text-xs">
          로그아웃
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
        <button onClick={() => {
          localStorage.setItem("artsoul-identity-verified", "true");
          alert("본인인증이 완료되었습니다!");
        }} className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium hover:bg-primary/20 transition-colors">
          인증하기
        </button>
      </div>

      {/* 작가 모드 — 역할에 따라 다른 UI */}
      <ArtistSection navigate={navigate} />

      {/* Liked Artworks */}
      <SectionHeader title="좋아한 작품" count={likes.length} />
      {likes.length === 0 ? (
        <div className="text-center py-8 mb-6">
          <p className="text-sm text-muted-foreground">좋아한 작품이 없습니다</p>
          <button onClick={() => navigate("/explore")} className="text-xs text-primary mt-1">작품 둘러보기</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {likes.map((art) => (
            <div key={art.id} className="group cursor-pointer" onClick={() => navigate(`/artwork/${art.id}`)}>
              <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border mb-2 transition-all group-hover:border-primary/30">
                <CaseCodeArt element={art.element} energy={art.energy} style={art.style} />
              </div>
              <p className="text-xs font-medium text-foreground truncate">{art.title.split("—")[0].trim()}</p>
              <p className="text-[10px] text-muted-foreground">{art.artist}</p>
            </div>
          ))}
        </div>
      )}

      {/* Orders */}
      <SectionHeader title="주문 내역" count={orders.length} />
      {orders.length === 0 ? (
        <div className="text-center py-8 mb-6">
          <p className="text-sm text-muted-foreground">주문 내역이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center text-lg shrink-0">
                {order.type === "rental" ? "🔄" : "🖼️"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{order.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(order.date).toLocaleDateString("ko-KR")}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-[10px] font-medium ${order.status === "렌탈중" ? "text-primary" : "text-muted-foreground"}`}>
                  {order.status}
                </p>
                <p className="text-xs text-foreground">₩{order.amount.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rental */}
      <SectionHeader title="렌탈 현황" count={rentals.length} />
      {rentals.length === 0 ? (
        <div className="text-center py-8 mb-6">
          <p className="text-sm text-muted-foreground">이용중인 렌탈이 없습니다</p>
          <button onClick={() => navigate("/explore")} className="text-xs text-primary mt-1">렌탈 가능 작품 보기</button>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {rentals.map((rental) => (
            <div key={rental.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-surface border border-border flex items-center justify-center text-3xl shrink-0">
                🔄
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">{rental.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  다음 교체일: {new Date(rental.nextExchangeDate).toLocaleDateString("ko-KR")}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] text-primary font-medium">
                    {rental.status === "active" ? "이용중" : rental.status === "exchange_pending" ? "교체대기" : "반납완료"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    월 ₩{rental.monthlyPrice.toLocaleString()} · {rental.cycle === "3m" ? "3개월" : "6개월"}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      )}

      <TabBar activeTab="my" />
    </PageContainer>
  );
};

// ── 작가 모드 섹션 ─────────────────────────────────
import { applyAsArtist, getArtistStatus } from "@/services/artist";

function ArtistSection({ navigate }: { navigate: (path: string) => void }) {
  const [artistStatus, setArtistStatus] = useState<"none" | "pending" | "approved" | "rejected">("none");
  const [showApply, setShowApply] = useState(false);
  const [artistName, setArtistName] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [intro, setIntro] = useState("");
  const [businessNum, setBusinessNum] = useState("");
  const [applyMsg, setApplyMsg] = useState("");
  const [applying, setApplying] = useState(false);

  // DB에서 작가 상태 읽기
  useEffect(() => {
    getArtistStatus().then(setArtistStatus).catch(() => {});
  }, []);

  const handleApply = async () => {
    if (!artistName) { setApplyMsg("활동명을 입력해주세요"); return; }
    if (!portfolio && !intro) { setApplyMsg("포트폴리오 또는 작가 소개를 입력해주세요"); return; }
    setApplying(true);
    const success = await applyAsArtist({
      artistName,
      bio: intro,
      portfolioUrl: portfolio,
      businessNumber: businessNum || undefined,
    });
    setApplying(false);
    if (success) {
      setArtistStatus("pending");
      setShowApply(false);
      setApplyMsg("");
    } else {
      setApplyMsg("신청 중 오류가 발생했습니다");
    }
  };

  // 승인된 작가
  if (artistStatus === "approved") {
    return (
      <div className="w-full bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-foreground">작가 모드</p>
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              </div>
              <p className="text-[10px] text-muted-foreground">작품 등록 및 판매 관리</p>
            </div>
          </div>
          <button onClick={() => navigate("/artist-dashboard")}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
            대시보드
          </button>
        </div>
      </div>
    );
  }

  // 심사 대기중
  if (artistStatus === "pending") {
    return (
      <div className="w-full bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">작가 신청 심사 중</p>
            <p className="text-[10px] text-muted-foreground">포트폴리오 확인 후 승인됩니다. 보통 1~3일 소요.</p>
          </div>
        </div>
      </div>
    );
  }

  // 거절됨
  if (artistStatus === "rejected") {
    return (
      <div className="w-full bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">작가 신청이 반려되었습니다</p>
              <p className="text-[10px] text-muted-foreground">포트폴리오를 보완하여 다시 신청할 수 있어요</p>
            </div>
          </div>
          <button onClick={() => { setShowApply(true); setArtistStatus("none"); }}
            className="text-xs text-primary font-medium">재신청</button>
        </div>
      </div>
    );
  }

  // 미신청
  return (
    <div className="w-full bg-surface border border-border rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center">
            <Palette className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">작가로 활동하기</p>
            <p className="text-[10px] text-muted-foreground">작품을 등록하고 판매·렌탈하세요</p>
          </div>
        </div>
        <button onClick={() => setShowApply(!showApply)}
          className="text-xs text-primary font-medium">{showApply ? "닫기" : "신청하기"}</button>
      </div>

      {showApply && (
        <div className="space-y-3 animate-fade-in">
          <div className="bg-card border border-border rounded-lg p-3 space-y-2">
            <input type="text" placeholder="활동명 (작가명) *" value={artistName} onChange={e => setArtistName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground/50" />
            <input type="url" placeholder="포트폴리오 URL (인스타, 비핸스 등)" value={portfolio} onChange={e => setPortfolio(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground/50" />
            <textarea placeholder="작가 소개 (작품 활동, 경력, 수상 이력 등)" value={intro} onChange={e => setIntro(e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground/50 resize-none" />
            <input type="text" placeholder="사업자 번호 (선택)" value={businessNum} onChange={e => setBusinessNum(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground/50" />
            <button onClick={handleApply} disabled={applying}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">
              {applying ? "신청 중..." : "작가 신청하기"}
            </button>
            <p className="text-[10px] text-muted-foreground">포트폴리오 심사 후 승인됩니다 (1~3일)</p>
          </div>
          {applyMsg && <p className="text-[10px] text-red-400">{applyMsg}</p>}
        </div>
      )}
    </div>
  );
}

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
