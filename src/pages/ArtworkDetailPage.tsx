import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import { Heart, Share2, ChevronLeft, ChevronRight, Star } from "lucide-react";

const MOCK_ARTWORK = {
  id: "1",
  title: "청산유수",
  artist: { name: "김민수", avatar: "🧑‍🎨", works: 24 },
  genre: "수묵담채",
  width: 60,
  height: 90,
  purchasePrice: 1800000,
  rentalPrice: 45000,
  rentalAvailable: true,
  ohaengTags: ["木", "水"],
  emojis: ["🏔️", "🌊", "🎋"],
  matchScore: 87,
  matchReason: "목(木) 기운이 강한 당신의 사주와 이 작품의 자연주의적 에너지가 깊이 공명합니다.",
};

const MOCK_SIMILAR = [
  { id: "2", title: "봄의 서곡", artist: "박서연", emoji: "🌷" },
  { id: "3", title: "해조음", artist: "최하늘", emoji: "🌊" },
  { id: "4", title: "묵란도", artist: "한지민", emoji: "🎋" },
  { id: "5", title: "산월", artist: "정은채", emoji: "🌕" },
];

const ArtworkDetailPage = () => {
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const art = MOCK_ARTWORK;

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="mobile-container flex flex-col pb-24">
        {/* Image Viewer */}
        <div className="relative aspect-[3/4] bg-surface">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-background/60 backdrop-blur-sm border border-border flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          {/* Image area */}
          <div className="w-full h-full flex items-center justify-center text-8xl select-none">
            {art.emojis[currentImage]}
          </div>

          {/* Dots */}
          {art.emojis.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {art.emojis.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === currentImage ? "bg-primary w-4" : "bg-foreground/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-6 pt-5 space-y-5">
          {/* Info */}
          <div>
            <h1 className="text-xl font-display text-gold-gradient font-semibold">{art.title}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {art.genre} · {art.width}×{art.height} cm
            </p>
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-lg font-semibold text-foreground">
                ₩{art.purchasePrice.toLocaleString()}
              </span>
              <span className="text-xs text-primary">
                월 ₩{art.rentalPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex gap-1.5 mt-3">
              {art.ohaengTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] text-primary font-medium"
                >
                  {tag}행
                </span>
              ))}
            </div>
          </div>

          {/* Saju Match Score */}
          <div className="bg-card border border-border rounded-2xl p-5 glow-mystical">
            <div className="flex items-center gap-4">
              {/* Circular progress */}
              <div className="relative w-16 h-16 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeDasharray={`${art.matchScore * 0.94} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-primary">
                  {art.matchScore}%
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">나와의 매칭</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{art.matchReason}</p>
              </div>
            </div>
          </div>

          {/* Artist Mini Profile */}
          <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center text-xl">
              {art.artist.avatar}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{art.artist.name}</p>
              <p className="text-[10px] text-muted-foreground">작품 {art.artist.works}점</p>
            </div>
            <button onClick={() => navigate(`/artist/${art.id}`)} className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
              프로필 보기
            </button>
          </div>

          {/* Similar */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">비슷한 작품</p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {MOCK_SIMILAR.map((s) => (
                <div key={s.id} className="shrink-0 w-28">
                  <div className="w-28 h-36 rounded-xl bg-surface border border-border flex items-center justify-center text-3xl mb-1.5">
                    {s.emoji}
                  </div>
                  <p className="text-[10px] font-medium text-foreground truncate">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground">{s.artist}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Bottom Bar */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/90 backdrop-blur-xl border-t border-border px-5 py-3 pb-[env(safe-area-inset-bottom,12px)] z-50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all ${
                isLiked
                  ? "border-red-500/50 bg-red-500/10 text-red-400"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} />
            </button>
            <button className="w-11 h-11 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button
              disabled={!art.rentalAvailable}
              onClick={() => navigate(`/rental?title=${encodeURIComponent(art.title)}&price=${art.rentalPrice}`)}
              className="flex-1 py-3 rounded-xl border border-primary/40 text-sm font-medium text-primary hover:bg-primary/5 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              렌탈하기
            </button>
            <button
              onClick={() => navigate(`/purchase?title=${encodeURIComponent(art.title)}&price=${art.purchasePrice}`)}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-transform active:scale-[0.98]"
            >
              구매하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtworkDetailPage;
