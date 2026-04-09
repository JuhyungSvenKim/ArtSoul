import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, TrendingUp, RotateCcw, Wallet, Image, MoreVertical, Eye, Edit, Trash2 } from "lucide-react";

const MOCK_STATS = {
  totalSales: 5400000,
  monthSales: 1800000,
  totalRentals: 3,
  pendingSettlement: 720000,
};

const MOCK_ARTWORKS = [
  { id: "1", title: "청산유수", emoji: "🏔️", status: "판매중", views: 342, likes: 28, price: 1800000 },
  { id: "2", title: "묵란도", emoji: "🎋", status: "판매중", views: 189, likes: 15, price: 1200000 },
  { id: "3", title: "월하독작", emoji: "🌕", status: "렌탈중", views: 456, likes: 41, price: 2200000 },
  { id: "4", title: "송림청풍", emoji: "🌲", status: "심사중", views: 0, likes: 0, price: 950000 },
];

const MOCK_RENTALS = [
  { id: "r1", artwork: "월하독작", renter: "이**", cycle: "3개월", nextExchange: "2025.07.06", monthlyPrice: 55000 },
  { id: "r2", artwork: "운해", renter: "박**", cycle: "6개월", nextExchange: "2025.10.06", monthlyPrice: 38000 },
  { id: "r3", artwork: "설경", renter: "김**", cycle: "3개월", nextExchange: "2025.08.15", monthlyPrice: 42000 },
];

const MOCK_SETTLEMENTS = [
  { id: "s1", date: "2025.03.15", amount: 1080000, type: "판매", artwork: "청산유수", status: "완료" },
  { id: "s2", date: "2025.03.01", amount: 165000, type: "렌탈", artwork: "월 정산", status: "완료" },
  { id: "s3", date: "2025.02.15", amount: 720000, type: "판매", artwork: "묵란도", status: "완료" },
  { id: "s4", date: "2025.04.15", amount: 720000, type: "렌탈+판매", artwork: "4월 정산", status: "예정" },
];

type Tab = "overview" | "artworks" | "rentals" | "settlement";

const ArtistDashboardPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "개요" },
    { id: "artworks", label: "작품 관리" },
    { id: "rentals", label: "렌탈" },
    { id: "settlement", label: "정산" },
  ];

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="mobile-container flex flex-col pb-8">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-display font-semibold text-foreground">작가 대시보드</h1>
          </div>
          <button onClick={() => navigate("/artwork-upload")} className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 px-5 mb-4 overflow-x-auto scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                tab === t.id ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 px-5 space-y-4 overflow-y-auto">
          {/* Overview */}
          {tab === "overview" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: TrendingUp, label: "총 판매액", value: `₩${MOCK_STATS.totalSales.toLocaleString()}`, color: "text-primary" },
                  { icon: TrendingUp, label: "이번 달", value: `₩${MOCK_STATS.monthSales.toLocaleString()}`, color: "text-primary" },
                  { icon: RotateCcw, label: "렌탈 중", value: `${MOCK_STATS.totalRentals}건`, color: "text-foreground" },
                  { icon: Wallet, label: "정산 예정", value: `₩${MOCK_STATS.pendingSettlement.toLocaleString()}`, color: "text-primary" },
                ].map(({ icon: Icon, label, value, color }, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4">
                    <Icon className="w-4 h-4 text-muted-foreground mb-2" />
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className={`text-sm font-semibold mt-0.5 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">최근 활동</p>
                <div className="space-y-2">
                  {MOCK_SETTLEMENTS.slice(0, 3).map((s) => (
                    <div key={s.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-foreground">{s.artwork}</p>
                        <p className="text-[10px] text-muted-foreground">{s.date} · {s.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-primary">₩{s.amount.toLocaleString()}</p>
                        <p className={`text-[10px] ${s.status === "완료" ? "text-green-400" : "text-muted-foreground"}`}>{s.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Artworks */}
          {tab === "artworks" && (
            <div className="space-y-3">
              {MOCK_ARTWORKS.map((art) => (
                <div key={art.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 relative">
                  <div className="w-14 h-18 rounded-lg bg-surface border border-border flex items-center justify-center text-2xl shrink-0">
                    {art.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{art.title}</p>
                    <p className="text-[10px] text-muted-foreground">₩{art.price.toLocaleString()}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Eye className="w-3 h-3" /> {art.views}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        art.status === "판매중" ? "bg-green-500/10 text-green-400" :
                        art.status === "렌탈중" ? "bg-primary/10 text-primary" :
                        "bg-muted text-muted-foreground"
                      }`}>{art.status}</span>
                    </div>
                  </div>
                  <button onClick={() => setMenuOpen(menuOpen === art.id ? null : art.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpen === art.id && (
                    <div className="absolute right-4 top-12 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                      <button className="flex items-center gap-2 px-4 py-2.5 text-xs text-foreground hover:bg-surface w-full">
                        <Edit className="w-3.5 h-3.5" /> 수정
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2.5 text-xs text-destructive hover:bg-surface w-full">
                        <Trash2 className="w-3.5 h-3.5" /> 삭제
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={() => navigate("/artwork-upload")}
                className="w-full py-3.5 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> 새 작품 추가
              </button>
            </div>
          )}

          {/* Rentals */}
          {tab === "rentals" && (
            <div className="space-y-3">
              {MOCK_RENTALS.map((r) => (
                <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">{r.artwork}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">렌탈중</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">대여자</span>
                      <span className="text-foreground">{r.renter}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">교체 주기</span>
                      <span className="text-foreground">{r.cycle}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">다음 교체일</span>
                      <span className="text-foreground">{r.nextExchange}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">월 수익</span>
                      <span className="text-primary font-semibold">₩{r.monthlyPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Settlement */}
          {tab === "settlement" && (
            <div className="space-y-3">
              <div className="bg-card border border-primary/20 rounded-xl p-4 glow-mystical">
                <p className="text-[10px] text-muted-foreground">정산 예정 금액</p>
                <p className="text-xl font-semibold text-primary mt-0.5">₩{MOCK_STATS.pendingSettlement.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground mt-1">다음 정산일: 2025.04.15</p>
              </div>
              {MOCK_SETTLEMENTS.map((s) => (
                <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.artwork}</p>
                    <p className="text-[10px] text-muted-foreground">{s.date} · {s.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">₩{s.amount.toLocaleString()}</p>
                    <p className={`text-[10px] ${s.status === "완료" ? "text-green-400" : "text-yellow-400"}`}>{s.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtistDashboardPage;
