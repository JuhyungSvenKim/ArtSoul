import { useState, useEffect } from "react";
import PageContainer from "@/components/PageContainer";
import TabBar from "@/components/TabBar";
import { Search, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/lib/supabase";

const OHAENG = [
  { key: "목", label: "木", color: "#4CAF50", emoji: "🌿" },
  { key: "화", label: "火", color: "#FF5722", emoji: "🔥" },
  { key: "토", label: "土", color: "#FFC107", emoji: "🪨" },
  { key: "금", label: "金", color: "#9E9E9E", emoji: "⚔️" },
  { key: "수", label: "水", color: "#2196F3", emoji: "💧" },
];

const GENRES = ["수묵화", "유화", "수채화", "판화", "디지털아트", "혼합매체"];
const SORT_OPTIONS = ["최신순", "인기순", "가격순"];

const GENRE_EMOJI: Record<string, string> = {
  수묵화: "🎋", 유화: "🎨", 수채화: "💧", 판화: "🖼️", 디지털아트: "💻", 혼합매체: "✨", 사진: "📷", 조각: "🗿",
};

const ExplorePage = () => {
  const [query, setQuery] = useState("");
  const [selectedOhaeng, setSelectedOhaeng] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [sort, setSort] = useState("최신순");
  const [showFilters, setShowFilters] = useState(false);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArtworks();
  }, [selectedOhaeng, selectedGenre, sort, query]);

  const loadArtworks = async () => {
    setLoading(true);
    let q = supabase
      .from("artworks")
      .select("*")
      .eq("status", "available");

    if (selectedOhaeng) q = q.eq("primary_ohaeng", selectedOhaeng);
    if (selectedGenre) q = q.eq("genre", selectedGenre);
    if (query) q = q.or(`title.ilike.%${query}%,artist_name.ilike.%${query}%`);

    if (sort === "최신순") q = q.order("created_at", { ascending: false });
    else if (sort === "인기순") q = q.order("view_count", { ascending: false });
    else if (sort === "가격순") q = q.order("price", { ascending: true });

    const { data } = await q.limit(20);
    setArtworks(data || []);
    setLoading(false);
  };

  return (
    <PageContainer className="pb-24">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="작품, 작가 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${showFilters ? "text-primary" : "text-muted-foreground"}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="space-y-3 mb-4 animate-fade-in">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">장르</p>
            <div className="flex gap-2 flex-wrap">
              {GENRES.map((g) => (
                <button key={g} onClick={() => setSelectedGenre(selectedGenre === g ? null : g)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all ${selectedGenre === g ? "bg-primary text-primary-foreground" : "bg-surface border border-border text-muted-foreground hover:border-primary/40"}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">정렬</p>
            <div className="flex gap-2">
              {SORT_OPTIONS.map((s) => (
                <button key={s} onClick={() => setSort(s)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all ${sort === s ? "bg-primary text-primary-foreground" : "bg-surface border border-border text-muted-foreground"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ohaeng Collection Row */}
      <div className="flex justify-between mb-6">
        {OHAENG.map((o) => (
          <button key={o.key} onClick={() => setSelectedOhaeng(selectedOhaeng === o.key ? null : o.key)}
            className={`flex flex-col items-center gap-1.5 transition-all ${selectedOhaeng === o.key ? "scale-110" : ""}`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${selectedOhaeng === o.key ? "border-primary glow-gold" : "border-border bg-surface"}`}>
              {o.emoji}
            </div>
            <span className="text-xs font-semibold" style={{ color: selectedOhaeng === o.key ? o.color : undefined }}>
              {o.label}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : artworks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">등록된 작품이 없습니다</p>
          <p className="text-muted-foreground/50 text-xs mt-1">어드민에서 작품을 등록해주세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {artworks.map((art) => (
            <div key={art.id} className="group">
              <div className="aspect-[3/4] rounded-xl bg-surface border border-border flex items-center justify-center text-4xl mb-2 transition-all group-hover:border-primary/30 group-active:scale-[0.97] overflow-hidden">
                {art.image_url ? (
                  <img src={art.image_url} alt={art.title} className="w-full h-full object-cover" />
                ) : (
                  <span>{GENRE_EMOJI[art.genre] || "🖼️"}</span>
                )}
              </div>
              <p className="text-xs font-medium text-foreground truncate">{art.title}</p>
              <p className="text-[10px] text-muted-foreground">{art.artist_name}</p>
              <p className="text-[10px] text-primary font-medium mt-0.5">
                {art.price?.toLocaleString()}원
              </p>
            </div>
          ))}
        </div>
      )}

      <TabBar activeTab="explore" />
    </PageContainer>
  );
};

export default ExplorePage;
