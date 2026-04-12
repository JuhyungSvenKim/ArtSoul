import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, TrendingUp, RotateCcw, Wallet, Image, MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/lib/current-user";
import { getMyArtistProfile } from "@/services/artist";

type Tab = "overview" | "artworks" | "rentals" | "settlement";

const ArtistDashboardPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [artistName, setArtistName] = useState("");
  const [artworks, setArtworks] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const userId = getCurrentUserId();
    if (!userId) { setLoading(false); return; }

    // 작가 프로필
    const profile = await getMyArtistProfile();
    if (profile) setArtistName(profile.artist_name);

    // 내 작품 목록
    const { data: arts } = await supabase.from("artworks")
      .select("*").eq("artist_id", userId).order("created_at", { ascending: false });
    setArtworks(arts || []);

    // 내 작품 관련 주문
    const { data: ords } = await supabase.from("orders")
      .select("*").order("created_at", { ascending: false });
    setOrders(ords || []);

    setLoading(false);
  };

  const deleteArtwork = async (id: string) => {
    if (!confirm("이 작품을 삭제하시겠습니까?")) return;
    await supabase.from("artworks").delete().eq("id", id);
    setArtworks(prev => prev.filter(a => a.id !== id));
  };

  // 통계 계산
  const totalSales = orders.filter(o => o.type === "purchase").reduce((s, o) => s + (o.amount || 0), 0);
  const totalRentals = orders.filter(o => o.type === "rental").length;
  const artworkCount = artworks.length;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "개요" },
    { id: "artworks", label: `작품 (${artworkCount})` },
    { id: "rentals", label: "렌탈" },
    { id: "settlement", label: "정산" },
  ];

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="max-w-5xl mx-auto w-full flex flex-col px-6 py-8 pt-20 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-display font-semibold text-foreground">작가 대시보드</h1>
              {artistName && <p className="text-xs text-muted-foreground">{artistName}</p>}
            </div>
          </div>
          <button onClick={() => navigate("/artwork-upload")} className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 px-5 mb-4 overflow-x-auto scrollbar-hide">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                tab === t.id ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"
              }`}>{t.label}</button>
          ))}
        </div>

        <div className="flex-1 px-5 space-y-4 overflow-y-auto">
          {loading && <p className="text-sm text-muted-foreground text-center py-12">불러오는 중...</p>}

          {/* Overview */}
          {!loading && tab === "overview" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: TrendingUp, label: "총 판매액", value: `₩${totalSales.toLocaleString()}`, color: "text-primary" },
                  { icon: Image, label: "등록 작품", value: `${artworkCount}점`, color: "text-foreground" },
                  { icon: RotateCcw, label: "렌탈 중", value: `${totalRentals}건`, color: "text-foreground" },
                  { icon: Wallet, label: "총 거래", value: `${orders.length}건`, color: "text-primary" },
                ].map(({ icon: Icon, label, value, color }, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4">
                    <Icon className="w-4 h-4 text-muted-foreground mb-2" />
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className={`text-sm font-semibold mt-0.5 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* 최근 주문 */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">최근 주문</p>
                {orders.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">아직 주문이 없습니다</p>
                ) : (
                  <div className="space-y-2">
                    {orders.slice(0, 5).map((o: any, i: number) => (
                      <div key={i} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-foreground">{o.artwork_title || o.title || "작품"}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {o.created_at ? new Date(o.created_at).toLocaleDateString("ko-KR") : ""} · {o.type === "rental" ? "렌탈" : "구매"}
                          </p>
                        </div>
                        <p className="text-xs font-semibold text-primary">₩{(o.amount || 0).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Artworks */}
          {!loading && tab === "artworks" && (
            <div className="space-y-3">
              {artworks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-12">등록된 작품이 없습니다</p>
              )}
              {artworks.map((art: any) => (
                <div key={art.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 relative">
                  <div className="w-14 h-18 rounded-lg bg-surface border border-border flex items-center justify-center text-xl shrink-0 overflow-hidden">
                    {art.image_url ? <img src={art.image_url} alt="" className="w-full h-full object-cover" /> : "🖼️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{art.title}</p>
                    <p className="text-[10px] text-muted-foreground">₩{(art.price || 0).toLocaleString()}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        art.status === "available" ? "bg-green-500/10 text-green-400" :
                        art.status === "rented" ? "bg-primary/10 text-primary" :
                        "bg-muted text-muted-foreground"
                      }`}>{art.status === "available" ? "판매중" : art.status === "rented" ? "렌탈중" : art.status}</span>
                    </div>
                  </div>
                  <button onClick={() => setMenuOpen(menuOpen === art.id ? null : art.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpen === art.id && (
                    <div className="absolute right-4 top-12 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                      <button onClick={() => { deleteArtwork(art.id); setMenuOpen(null); }}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs text-destructive hover:bg-surface w-full">
                        <Trash2 className="w-3.5 h-3.5" /> 삭제
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={() => navigate("/artwork-upload")}
                className="w-full py-3.5 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> 새 작품 추가
              </button>
            </div>
          )}

          {/* Rentals */}
          {!loading && tab === "rentals" && (
            <div className="space-y-3">
              {orders.filter(o => o.type === "rental").length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">렌탈 중인 작품이 없습니다</p>
              ) : (
                orders.filter(o => o.type === "rental").map((r: any, i: number) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">{r.artwork_title || "작품"}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">렌탈중</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">월 수익</span>
                      <span className="text-primary font-semibold">₩{(r.amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Settlement */}
          {!loading && tab === "settlement" && (
            <div className="space-y-3">
              <div className="bg-card border border-primary/20 rounded-xl p-4 glow-mystical">
                <p className="text-[10px] text-muted-foreground">총 판매 수익</p>
                <p className="text-xl font-semibold text-primary mt-0.5">₩{totalSales.toLocaleString()}</p>
              </div>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">정산 내역이 없습니다</p>
              ) : (
                orders.map((o: any, i: number) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{o.artwork_title || "작품"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString("ko-KR") : ""} · {o.type === "rental" ? "렌탈" : "판매"}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-primary">₩{(o.amount || 0).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtistDashboardPage;
