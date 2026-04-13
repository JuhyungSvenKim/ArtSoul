import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import TabBar from "@/components/TabBar";
import { Search, SlidersHorizontal } from "lucide-react";
import CaseCodeArt from "@/components/CaseCodeArt";
import { getSampleArtworks, type SampleArtwork } from "@/data/sample-artworks";
import { supabase } from "@/lib/supabase";
import { ELEMENT_MAP, ENERGY_MAP, STYLE_MAP } from "@/lib/case-code/types";
import type { OhaengElement, StyleCode } from "@/lib/case-code/types";
import { useOnboardingStore } from "@/stores/onboarding";
import { getSaju } from "@/lib/saju";
import { getOhaengBalance, getYongsin } from "@/lib/saju/analysis";

const OHAENG_FILTERS: { key: OhaengElement; label: string; color: string }[] = [
  { key: "W", label: "木", color: "#4a9e6e" },
  { key: "F", label: "火", color: "#d45050" },
  { key: "E", label: "土", color: "#c49a3c" },
  { key: "M", label: "金", color: "#a0a0a0" },
  { key: "A", label: "水", color: "#4a7eb5" },
];

const STYLE_FILTERS: { key: StyleCode; label: string }[] = [
  { key: "S1", label: "고전" },
  { key: "S2", label: "동양" },
  { key: "S3", label: "모던" },
  { key: "S4", label: "팝" },
  { key: "S5", label: "프리미엄" },
];

// 샘플 화가 데이터
const SAMPLE_ARTISTS = [
  { id: "a1", name: "김수연", bio: "자연의 숨결을 캔버스에 담는 작가", style: "자연주의 · 수채화", ohaeng: "목" as const, mbti: "INFP", artCount: 12, followers: 234, avatar: "🎨" },
  { id: "a2", name: "이도윤", bio: "빛과 열정의 추상을 그리는 작가", style: "표현주의 · 추상화", ohaeng: "화" as const, mbti: "ENFJ", artCount: 8, followers: 187, avatar: "🔥" },
  { id: "a3", name: "오현석", bio: "전통과 현대의 경계를 허무는 작가", style: "민화 · 현대미술", ohaeng: "토" as const, mbti: "ISTJ", artCount: 15, followers: 312, avatar: "🏺" },
  { id: "a4", name: "최하늘", bio: "미니멀의 극치, 여백의 미를 추구", style: "미니멀리즘 · 설치", ohaeng: "금" as const, mbti: "INTJ", artCount: 6, followers: 156, avatar: "🪷" },
  { id: "a5", name: "한지민", bio: "물처럼 유연하고 깊은 감성의 작가", style: "수묵담채 · 몽환", ohaeng: "수" as const, mbti: "INFJ", artCount: 10, followers: 278, avatar: "🌊" },
  { id: "a6", name: "박서연", bio: "색채의 마법사, 자연을 재해석", style: "인상주의 · 풍경화", ohaeng: "목" as const, mbti: "ISFP", artCount: 20, followers: 445, avatar: "🌿" },
  { id: "a7", name: "김태리", bio: "대담한 컨템포러리의 선두주자", style: "팝아트 · 그래픽", ohaeng: "화" as const, mbti: "ENTP", artCount: 9, followers: 523, avatar: "💥" },
  { id: "a8", name: "정은채", bio: "따뜻한 감성으로 일상을 그리는 작가", style: "정물화 · 일러스트", ohaeng: "토" as const, mbti: "ESFJ", artCount: 14, followers: 198, avatar: "☕" },
  { id: "a9", name: "이현석", bio: "동양의 선과 서양의 구도를 융합", style: "수묵 · 건축사진", ohaeng: "금" as const, mbti: "ISTP", artCount: 7, followers: 167, avatar: "🖋️" },
  { id: "a10", name: "유재석", bio: "한국 전통미를 현대적으로 재해석", style: "민화 · 도자기", ohaeng: "토" as const, mbti: "ESFP", artCount: 11, followers: 289, avatar: "🎎" },
];

const OHAENG_COMPAT: Record<string, Record<string, { score: number; label: string }>> = {
  목: { 목: { score: 70, label: "비화" }, 화: { score: 90, label: "상생" }, 토: { score: 40, label: "상극" }, 금: { score: 35, label: "역극" }, 수: { score: 85, label: "역생" } },
  화: { 목: { score: 85, label: "역생" }, 화: { score: 70, label: "비화" }, 토: { score: 90, label: "상생" }, 금: { score: 40, label: "상극" }, 수: { score: 35, label: "역극" } },
  토: { 목: { score: 35, label: "역극" }, 화: { score: 85, label: "역생" }, 토: { score: 70, label: "비화" }, 금: { score: 90, label: "상생" }, 수: { score: 40, label: "상극" } },
  금: { 목: { score: 40, label: "상극" }, 화: { score: 35, label: "역극" }, 토: { score: 85, label: "역생" }, 금: { score: 70, label: "비화" }, 수: { score: 90, label: "상생" } },
  수: { 목: { score: 90, label: "상생" }, 화: { score: 40, label: "상극" }, 토: { score: 35, label: "역극" }, 금: { score: 85, label: "역생" }, 수: { score: 70, label: "비화" } },
};

const OHAENG_KOR: Record<string, string> = { 목: "목(木)", 화: "화(火)", 토: "토(土)", 금: "금(金)", 수: "수(水)" };
const OHAENG_COLORS: Record<string, { bg: string; text: string }> = {
  목: { bg: "bg-green-500/20", text: "text-green-400" },
  화: { bg: "bg-red-500/20", text: "text-red-400" },
  토: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  금: { bg: "bg-gray-400/20", text: "text-gray-300" },
  수: { bg: "bg-blue-500/20", text: "text-blue-400" },
};

const ExplorePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const store = useOnboardingStore();
  const initialTab = searchParams.get("tab") === "artists" ? "artists" : "artworks";
  const [tab, setTab] = useState<"artworks" | "artists">(initialTab);

  const changeTab = (t: "artworks" | "artists") => {
    setTab(t);
    setSearchParams({ tab: t }, { replace: true });
  };
  const [query, setQuery] = useState("");
  const [selectedElement, setSelectedElement] = useState<OhaengElement | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleCode | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // 유저 사주 오행
  const userOhaeng = useMemo(() => {
    try {
      const bd = store.birthDate; const g = store.gender;
      if (!bd || !g) return null;
      const [y, m, d] = bd.split("-").map(Number);
      const bt = store.birthTime; const hour = bt ? Number(bt.split(":")[0]) : 12;
      const result = getSaju({ year: y, month: m, day: d, hour, gender: g === "male" ? "남" : "여", calendarType: "양력" });
      const balance = getOhaengBalance(result);
      const yongsin = getYongsin(balance, result.ilju.ohaeng);
      return { dayOhaeng: result.ilju.ohaeng, yongsin: yongsin.element };
    } catch { return null; }
  }, [store.birthDate, store.gender]);

  const userMbti = store.mbti?.toUpperCase() || "";

  const sampleArtworks = useMemo(() => getSampleArtworks(), []);
  const [dbArtworks, setDbArtworks] = useState<SampleArtwork[]>([]);

  useEffect(() => {
    supabase.from("artworks").select("*").eq("status", "available").order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const mapped: SampleArtwork[] = data.map((a: any) => ({
            id: a.id, title: a.title, artist: a.artist_name,
            description: a.description || "",
            element: (a.primary_ohaeng === "목" ? "W" : a.primary_ohaeng === "화" ? "F" : a.primary_ohaeng === "토" ? "E" : a.primary_ohaeng === "금" ? "M" : "A") as any,
            energy: Math.min(5, Math.max(1, Math.round((a.ohaeng_scores?.목 || 0 + a.ohaeng_scores?.화 || 0) / 20) + 1)) as any,
            style: (a.style_tags?.[0]?.includes("팝") ? "S4" : a.style_tags?.[0]?.includes("수묵") ? "S2" : "S3") as any,
            caseCode: `${a.primary_ohaeng || "W"}3-S3`, tags: a.mood_tags || [],
            spaceType: "거실", priceRange: a.price > 2000000 ? "high" : a.price > 500000 ? "mid" : "low",
          }));
          setDbArtworks(mapped);
        }
      });
  }, []);

  const allArtworks = useMemo(() => [...dbArtworks, ...sampleArtworks], [dbArtworks, sampleArtworks]);

  const filteredArtworks = useMemo(() => {
    let result = allArtworks;
    if (selectedElement) result = result.filter(a => a.element === selectedElement);
    if (selectedStyle) result = result.filter(a => a.style === selectedStyle);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(a => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q) || a.caseCode.toLowerCase().includes(q));
    }
    return result;
  }, [allArtworks, selectedElement, selectedStyle, query]);

  const filteredArtists = useMemo(() => {
    let result = SAMPLE_ARTISTS;
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(a => a.name.includes(q) || a.bio.includes(q) || a.style.includes(q));
    }
    if (selectedElement) {
      const ohMap: Record<string, string> = { W: "목", F: "화", E: "토", M: "금", A: "수" };
      result = result.filter(a => a.ohaeng === ohMap[selectedElement]);
    }
    return result;
  }, [query, selectedElement]);

  return (
    <PageContainer className="pt-20">
      {/* 탭 */}
      <div className="flex gap-1 mb-4 bg-surface rounded-xl p-1">
        <button onClick={() => changeTab("artworks")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === "artworks" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
          작품
        </button>
        <button onClick={() => changeTab("artists")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === "artists" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
          화가
        </button>
      </div>

      {/* 검색 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder={tab === "artworks" ? "작품, 작가, 케이스코드 검색" : "화가 이름, 스타일 검색"} value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
        {tab === "artworks" && (
          <button onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${showFilters ? "text-primary" : "text-muted-foreground"}`}>
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 오행 필터 (공통) */}
      <div className="flex justify-between mb-4">
        {OHAENG_FILTERS.map((o) => (
          <button key={o.key} onClick={() => setSelectedElement(selectedElement === o.key ? null : o.key)}
            className={`flex flex-col items-center gap-1 transition-all ${selectedElement === o.key ? "scale-110" : ""}`}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold border-2 transition-all"
              style={{
                borderColor: selectedElement === o.key ? o.color : "var(--border)",
                backgroundColor: selectedElement === o.key ? `${o.color}20` : "var(--surface)",
                color: selectedElement === o.key ? o.color : "var(--muted-foreground)",
              }}>
              {o.label}
            </div>
          </button>
        ))}
      </div>

      {/* 스타일 필터 (작품 탭만) */}
      {tab === "artworks" && showFilters && (
        <div className="mb-4 animate-fade-in">
          <div className="flex gap-2 flex-wrap">
            {STYLE_FILTERS.map((s) => (
              <button key={s.key} onClick={() => setSelectedStyle(selectedStyle === s.key ? null : s.key)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${selectedStyle === s.key ? "bg-primary text-primary-foreground" : "bg-surface border border-border text-muted-foreground"}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 작품 탭 ── */}
      {tab === "artworks" && (
        <>
          <p className="text-xs text-muted-foreground mb-3">{filteredArtworks.length}개 작품</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredArtworks.slice(0, 30).map((art) => {
              const el = ELEMENT_MAP[art.element];
              return (
                <div key={art.id} className="group cursor-pointer" onClick={() => navigate(`/artwork/${art.id}`)}>
                  <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border mb-2 transition-all group-hover:border-primary/30">
                    <CaseCodeArt element={art.element} energy={art.energy} style={art.style} />
                  </div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{
                      backgroundColor: `${el?.color}15`, color: el?.color, border: `1px solid ${el?.color}30`
                    }}>{art.caseCode}</span>
                  </div>
                  <p className="text-xs font-medium text-foreground truncate">{art.title.split("—")[0].trim()}</p>
                  <p className="text-[10px] text-muted-foreground">{art.artist}</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── 화가 탭 ── */}
      {tab === "artists" && (
        <>
          <p className="text-xs text-muted-foreground mb-3">{filteredArtists.length}명의 화가</p>
          <div className="space-y-3">
            {filteredArtists.map((artist) => {
              const ohStyle = OHAENG_COLORS[artist.ohaeng];
              // 사주 궁합
              const sajuCompat = userOhaeng ? OHAENG_COMPAT[userOhaeng.dayOhaeng]?.[artist.ohaeng] : null;
              // MBTI 궁합 (간단 계산: 같은 글자 수)
              const mbtiMatch = userMbti ? (() => {
                let match = 0;
                for (let i = 0; i < 4; i++) if (userMbti[i] === artist.mbti[i]) match++;
                return match;
              })() : null;
              const mbtiScore = mbtiMatch !== null ? 40 + mbtiMatch * 15 : null;
              const totalScore = sajuCompat && mbtiScore ? Math.round((sajuCompat.score + mbtiScore) / 2) : sajuCompat?.score || mbtiScore || null;

              return (
                <div key={artist.id} className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all"
                  onClick={() => navigate(`/artist/${artist.id}`)}>
                  <div className="flex gap-3">
                    {/* 아바타 */}
                    <div className={`w-14 h-14 rounded-xl ${ohStyle.bg} flex items-center justify-center text-2xl shrink-0`}>
                      {artist.avatar}
                    </div>
                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground">{artist.name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ohStyle.bg} ${ohStyle.text}`}>{OHAENG_KOR[artist.ohaeng]}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface text-muted-foreground">{artist.mbti}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{artist.bio}</p>
                      <p className="text-[10px] text-foreground/60">{artist.style} · 작품 {artist.artCount}점</p>
                    </div>
                  </div>

                  {/* 궁합 */}
                  {totalScore !== null && (() => {
                    const ohN: Record<string, string> = { 목: "나무", 화: "불", 토: "흙", 금: "쇠", 수: "물" };
                    const sajuExplain = sajuCompat ? (
                      sajuCompat.label === "상생" ? `내 ${ohN[userOhaeng!.dayOhaeng]}(${userOhaeng!.dayOhaeng}) 기운이 화가의 ${ohN[artist.ohaeng]}(${artist.ohaeng})을 생해주는 관계. 이 화가의 작품이 내 에너지와 자연스럽게 공명해` :
                      sajuCompat.label === "역생" ? `화가의 ${ohN[artist.ohaeng]}(${artist.ohaeng}) 기운이 내 ${ohN[userOhaeng!.dayOhaeng]}(${userOhaeng!.dayOhaeng})을 살려줘. 이 화가의 작품을 보면 에너지가 충전되는 느낌` :
                      sajuCompat.label === "비화" ? `나와 같은 ${ohN[artist.ohaeng]} 기운이라 편안하고 익숙한 느낌. 감성이 통하기 쉬운 관계` :
                      sajuCompat.label === "상극" ? `내 ${ohN[userOhaeng!.dayOhaeng]}이 화가의 ${ohN[artist.ohaeng]}을 누르는 관계. 자극적이지만 긴장감이 있을 수 있어` :
                      `화가의 ${ohN[artist.ohaeng]}이 내 ${ohN[userOhaeng!.dayOhaeng]}을 누르는 관계. 도전적인 작품에서 성장의 기회를 얻을 수 있어`
                    ) : "";
                    const mbtiExplain = mbtiMatch !== null ? (
                      mbtiMatch === 4 ? `MBTI가 완전 동일! 취향이 거의 같아서 이 화가 작품은 바로 "내 취향저격"일 확률 높음` :
                      mbtiMatch === 3 ? `MBTI 4차원 중 3개 일치. 감성 코드가 비슷해서 작품 선택 기준이 잘 맞는 편` :
                      mbtiMatch === 2 ? `MBTI 반 정도 일치. 공감되는 부분도 있고 새로운 시각도 줄 수 있는 관계` :
                      mbtiMatch === 1 ? `MBTI가 많이 달라서 이 화가의 작품은 신선한 자극이 될 수 있어` :
                      `MBTI가 정반대! 완전 다른 시각의 작품이라 호불호가 갈릴 수 있지만, 새로운 세계를 열어줄 수도`
                    ) : "";
                    const totalExplain = totalScore >= 80 ? "종합적으로 최고의 궁합이야. 이 화가의 작품을 적극 추천!" :
                      totalScore >= 60 ? "꽤 잘 맞는 편이야. 이 화가의 작품을 한번 감상해봐" :
                      totalScore >= 45 ? "보통 궁합이지만, 뜻밖의 발견이 있을 수 있어" :
                      "궁합은 낮지만, 오히려 색다른 자극을 줄 수 있는 화가야";

                    return (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-muted-foreground">나와의 궁합</span>
                            <span className={`text-xs font-bold ${totalScore >= 80 ? "text-primary" : totalScore >= 60 ? "text-green-400" : totalScore >= 45 ? "text-yellow-400" : "text-red-400"}`}>
                              {totalScore}점
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${totalScore >= 80 ? "bg-primary" : totalScore >= 60 ? "bg-green-500" : totalScore >= 45 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${totalScore}%` }} />
                          </div>
                        </div>
                        <div className="flex gap-2 text-[10px] shrink-0">
                          {sajuCompat && (
                            <span className={`px-1.5 py-0.5 rounded ${sajuCompat.score >= 80 ? "bg-green-500/15 text-green-400" : sajuCompat.score >= 50 ? "bg-yellow-500/15 text-yellow-400" : "bg-red-500/15 text-red-400"}`}>
                              사주 {sajuCompat.label}
                            </span>
                          )}
                          {mbtiScore !== null && (
                            <span className={`px-1.5 py-0.5 rounded ${mbtiScore >= 80 ? "bg-green-500/15 text-green-400" : mbtiScore >= 60 ? "bg-yellow-500/15 text-yellow-400" : "bg-surface text-muted-foreground"}`}>
                              MBTI {mbtiMatch}/4
                            </span>
                          )}
                        </div>
                      </div>
                      {sajuExplain && <p className="text-[11px] text-foreground/70 leading-relaxed">{sajuExplain}</p>}
                      {mbtiExplain && <p className="text-[11px] text-foreground/70 leading-relaxed">{mbtiExplain}</p>}
                      <p className="text-[11px] text-primary/80 leading-relaxed">{totalExplain}</p>
                    </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </>
      )}

      <TabBar activeTab="explore" />
    </PageContainer>
  );
};

export default ExplorePage;
