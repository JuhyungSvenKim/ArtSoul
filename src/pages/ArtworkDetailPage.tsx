import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, Share2, ChevronLeft, Palette, MapPin, Sparkles, ShoppingBag, Loader2, Home } from "lucide-react";
import CaseCodeArt from "@/components/CaseCodeArt";
import { getSampleArtworks } from "@/data/sample-artworks";
import { ELEMENT_MAP, ENERGY_MAP, STYLE_MAP } from "@/lib/case-code/types";
import { curate, calculateRentalPrice } from "@/lib/curation-engine";
import { addToCart } from "@/lib/cart";
import { isLiked as checkLiked, toggleLike } from "@/lib/likes";
import { generateSajuCuratorNote, getCachedNote, setCachedNote } from "@/lib/curator";

// localStorage에서 사주 데이터 읽기
function loadUserSaju() {
  try { const r = localStorage.getItem("artsoul-saju-input"); if (r) return JSON.parse(r); } catch {}
  try { const r = localStorage.getItem("artsoul-onboarding"); if (r) { const p = JSON.parse(r); return p.state || p; } } catch {}
  return null;
}

const ArtworkDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  // 작품 찾기
  const allArtworks = useMemo(() => getSampleArtworks(), []);
  const [isLiked, setIsLiked] = useState(() => id ? checkLiked(id) : false);
  const artwork = allArtworks.find(a => a.id === id);

  // 사주 기반 큐레이팅
  const userSaju = useMemo(() => {
    const data = loadUserSaju();
    if (!data?.birthDate || !data?.gender) return null;
    try {
      const { getSaju } = require("@/lib/saju");
      const { getOhaengBalance, getYongsin } = require("@/lib/saju/analysis");
      const { analyzeYongsin } = require("@/lib/saju/yongsin");
      const [y, m, d] = data.birthDate.split("-").map(Number);
      const hour = data.birthTime ? Number(data.birthTime.split(":")[0]) : 12;
      const result = getSaju({ year: y, month: m, day: d, hour, gender: data.gender === "male" ? "남" : "여", calendarType: "양력" });
      const balance = getOhaengBalance(result);
      const yongsin = getYongsin(balance, result.ilju.ohaeng);
      const enhanced = analyzeYongsin({ yeonju: result.yeonju, wolju: result.wolju, ilju: result.ilju, siju: result.siju }, result.sipsung);
      return { yongsin: enhanced.yongsin, dayOh: enhanced.dayOhaeng, dayStrength: enhanced.dayStrength };
    } catch { return null; }
  }, []);

  const curation = useMemo(() => {
    if (!artwork) return null;
    return curate({
      element: artwork.element,
      energy: artwork.energy,
      style: artwork.style,
      title: artwork.title,
      userYongsin: userSaju?.yongsin,
      userDayOh: userSaju?.dayOh,
      userDayStrength: userSaju?.dayStrength,
    });
  }, [artwork, userSaju]);

  // 사주 맞춤 AI 큐레이터 노트
  const [sajuNote, setSajuNote] = useState<string | null>(null);
  const [sajuNoteLoading, setSajuNoteLoading] = useState(false);

  useEffect(() => {
    if (!artwork || !userSaju?.yongsin || !curation) return;

    const el = ELEMENT_MAP[artwork.element];
    const en = ENERGY_MAP[artwork.energy];
    const st = STYLE_MAP[artwork.style];
    const cacheKey = `saju-${artwork.id}-${userSaju.yongsin}-${userSaju.dayOh}`;

    // 캐시 확인
    const cached = getCachedNote(cacheKey);
    if (cached) { setSajuNote(cached); return; }

    // AI 호출
    setSajuNoteLoading(true);
    generateSajuCuratorNote({
      artworkTitle: artwork.title,
      artworkElement: el?.labelKor || artwork.element,
      artworkEnergy: en?.labelKor || String(artwork.energy),
      artworkStyle: st?.labelKor || artwork.style,
      userDayOh: userSaju.dayOh,
      userDayStrength: userSaju.dayStrength,
      userYongsin: userSaju.yongsin,
      matchScore: curation.matchScore,
    }).then(note => {
      setSajuNote(note);
      setCachedNote(cacheKey, note);
    }).catch(() => {
      // AI 실패 시 기존 템플릿 유지
      setSajuNote(curation.whyForMe);
    }).finally(() => setSajuNoteLoading(false));
  }, [artwork?.id, userSaju?.yongsin]);

  // 비슷한 작품
  const similar = useMemo(() => {
    if (!artwork) return [];
    return allArtworks
      .filter(a => a.id !== artwork.id && (a.element === artwork.element || a.energy === artwork.energy))
      .slice(0, 4);
  }, [artwork, allArtworks]);

  if (!artwork || !curation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">작품을 찾을 수 없습니다</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-primary text-sm">뒤로 가기</button>
        </div>
      </div>
    );
  }

  const el = ELEMENT_MAP[artwork.element];
  const en = ENERGY_MAP[artwork.energy];
  const st = STYLE_MAP[artwork.style];

  // 가격 (샘플 — 스타일별 기본 가격대)
  const priceMap = { S1: 2400000, S2: 1800000, S3: 1200000, S4: 900000, S5: 3600000 };
  const purchasePrice = priceMap[artwork.style] || 1500000;
  const rentalPrice = calculateRentalPrice(purchasePrice);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto">
        {/* 상단 이미지 + 뒤로가기 */}
        <div className="relative">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <button onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-background/60 backdrop-blur-sm border border-border flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button onClick={() => navigate("/home")}
              className="w-9 h-9 rounded-full bg-background/60 backdrop-blur-sm border border-border flex items-center justify-center">
              <Home className="w-4 h-4 text-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* 작품 이미지 */}
            <div className="aspect-[3/4] lg:aspect-auto lg:h-[600px]">
              <CaseCodeArt element={artwork.element} energy={artwork.energy} style={artwork.style} />
            </div>

            {/* 우측 정보 (데스크톱) */}
            <div className="hidden lg:flex flex-col p-8 overflow-y-auto max-h-[600px]">
              <ArtworkInfo artwork={artwork} el={el} en={en} st={st}
                purchasePrice={purchasePrice} rentalPrice={rentalPrice}
                curation={curation} navigate={navigate} isLiked={isLiked} setIsLiked={setIsLiked} />
            </div>
          </div>
        </div>

        {/* 모바일/태블릿 정보 */}
        <div className="lg:hidden px-6 pt-5 pb-24">
          <ArtworkInfo artwork={artwork} el={el} en={en} st={st}
            purchasePrice={purchasePrice} rentalPrice={rentalPrice}
            curation={curation} navigate={navigate} isLiked={isLiked} setIsLiked={setIsLiked} />
        </div>

        {/* 큐레이터 노트 */}
        <div className="px-6 lg:px-8 pb-6">
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">큐레이터 노트</p>
            </div>
            <div className="text-sm text-foreground/80 leading-[1.85] whitespace-pre-line">{curation.curatorNote}</div>
          </div>

          {/* 왜 내 사주에 좋은지 — AI 사주 큐레이터 */}
          {userSaju && (
            <div className="bg-card border border-primary/20 rounded-2xl p-6 mb-6 glow-mystical">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-primary">왜 이 그림이 나에게 좋을까?</p>
              </div>
              {sajuNoteLoading ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <p className="text-xs text-muted-foreground">사주 큐레이터가 분석 중...</p>
                </div>
              ) : (
                <p className="text-sm text-foreground/80 leading-[1.85] whitespace-pre-line">
                  {sajuNote || curation.whyForMe}
                </p>
              )}
            </div>
          )}

          {/* 공간 조언 */}
          <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">어디에 두면 좋을까?</p>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{curation.spaceAdvice}</p>
          </div>

          {/* 작품 특성 */}
          <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
            <p className="text-sm font-semibold text-foreground mb-4">작품 특성</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">오행 계열</p>
                <p className="text-sm font-medium" style={{ color: el?.color }}>{el?.labelKor}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">에너지</p>
                <p className="text-sm font-medium text-foreground">{en?.labelKor}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">스타일</p>
                <p className="text-sm font-medium text-foreground">{st?.labelKor}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">분위기</p>
                <div className="flex flex-wrap gap-1">
                  {curation.moodKeywords.map(k => (
                    <span key={k} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{k}</span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-foreground/70 mt-4 leading-relaxed">{curation.techniqueNote}</p>
          </div>

          {/* 비슷한 작품 */}
          {similar.length > 0 && (
            <div className="mb-8">
              <p className="text-sm font-semibold text-foreground mb-3">비슷한 작품</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {similar.map(s => (
                  <div key={s.id} className="group cursor-pointer" onClick={() => navigate(`/artwork/${s.id}`, { replace: true })}>
                    <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border mb-2 transition-all group-hover:border-primary/30">
                      <CaseCodeArt element={s.element} energy={s.energy} style={s.style} />
                    </div>
                    <p className="text-xs font-medium text-foreground truncate">{s.title.split("—")[0].trim()}</p>
                    <p className="text-[10px] text-muted-foreground">{s.artist}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 하단 고정 바 */}
        <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border z-50">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-2">
            <button onClick={() => {
              const liked = toggleLike({
                id: artwork.id, title: artwork.title, artist: artwork.artist,
                element: artwork.element, energy: artwork.energy, style: artwork.style,
              });
              setIsLiked(liked);
            }}
              className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all ${
                isLiked ? "border-red-500/50 bg-red-500/10 text-red-400" : "border-border text-muted-foreground"
              }`}>
              <Heart className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} />
            </button>
            <button onClick={() => {
              addToCart({
                artworkId: artwork.id, title: artwork.title, artist: artwork.artist,
                element: artwork.element, energy: artwork.energy, style: artwork.style,
                purchasePrice, rentalPrice, type: "purchase", addedAt: "",
              });
              alert("장바구니에 담았습니다!");
            }} className="w-11 h-11 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors">
              <ShoppingBag className="w-5 h-5" />
            </button>
            <button onClick={() => {
              addToCart({
                artworkId: artwork.id, title: artwork.title, artist: artwork.artist,
                element: artwork.element, energy: artwork.energy, style: artwork.style,
                purchasePrice, rentalPrice, type: "rental", addedAt: "",
              });
              navigate("/cart");
            }} className="flex-1 py-3 rounded-xl border border-primary/40 text-sm font-medium text-primary">
              렌탈 월 ₩{rentalPrice.toLocaleString()}
            </button>
            <button onClick={() => {
              addToCart({
                artworkId: artwork.id, title: artwork.title, artist: artwork.artist,
                element: artwork.element, energy: artwork.energy, style: artwork.style,
                purchasePrice, rentalPrice, type: "purchase", addedAt: "",
              });
              navigate("/cart");
            }} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
              구매 ₩{purchasePrice.toLocaleString()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 작품 기본 정보 컴포넌트
function ArtworkInfo({ artwork, el, en, st, purchasePrice, rentalPrice, curation, navigate, isLiked, setIsLiked }: any) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-display text-gold-gradient font-semibold">{artwork.title}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {st?.labelKor} · {en?.labelKor} 에너지 · {el?.labelKor} 계열
        </p>
        <p className="text-xs text-muted-foreground">{artwork.artist}</p>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-lg font-semibold text-foreground">₩{purchasePrice.toLocaleString()}</span>
        <span className="text-xs text-primary">렌탈 월 ₩{rentalPrice.toLocaleString()}</span>
      </div>

      <p className="text-sm text-foreground/80 leading-relaxed">{artwork.description}</p>

      {/* 매칭 점수 */}
      <div className="bg-card border border-border rounded-xl p-4 glow-mystical">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
                strokeDasharray={`${curation.matchScore * 0.94} 100`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">
              {curation.matchScore}%
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">나와의 매칭</p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{curation.matchSummary}</p>
          </div>
        </div>
      </div>

      {/* 분위기 태그 */}
      <div className="flex flex-wrap gap-1.5">
        {curation.moodKeywords.map((k: string) => (
          <span key={k} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">{k}</span>
        ))}
        {artwork.tags.map((t: string) => (
          <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-surface border border-border text-muted-foreground">{t}</span>
        ))}
      </div>
    </div>
  );
}

export default ArtworkDetailPage;
