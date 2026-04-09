import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import TabBar from "@/components/TabBar";
import { Search, SlidersHorizontal } from "lucide-react";
import CaseCodeArt from "@/components/CaseCodeArt";
import { getSampleArtworks, type SampleArtwork } from "@/data/sample-artworks";
import { ELEMENT_MAP, ENERGY_MAP, STYLE_MAP } from "@/lib/case-code/types";
import type { OhaengElement, StyleCode } from "@/lib/case-code/types";

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

const ExplorePage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedElement, setSelectedElement] = useState<OhaengElement | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleCode | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const allArtworks = useMemo(() => getSampleArtworks(), []);

  const filtered = useMemo(() => {
    let result = allArtworks;
    if (selectedElement) result = result.filter(a => a.element === selectedElement);
    if (selectedStyle) result = result.filter(a => a.style === selectedStyle);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(a => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q) || a.caseCode.toLowerCase().includes(q));
    }
    return result;
  }, [allArtworks, selectedElement, selectedStyle, query]);

  return (
    <PageContainer className="pb-24">
      {/* 검색 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="작품, 작가, 케이스코드 검색" value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
        <button onClick={() => setShowFilters(!showFilters)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${showFilters ? "text-primary" : "text-muted-foreground"}`}>
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 스타일 필터 */}
      {showFilters && (
        <div className="mb-4 animate-fade-in">
          <p className="text-xs text-muted-foreground mb-1.5">스타일</p>
          <div className="flex gap-2 flex-wrap">
            {STYLE_FILTERS.map((s) => (
              <button key={s.key} onClick={() => setSelectedStyle(selectedStyle === s.key ? null : s.key)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${selectedStyle === s.key ? "bg-primary text-primary-foreground" : "bg-surface border border-border text-muted-foreground hover:border-primary/40"}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 오행 필터 */}
      <div className="flex justify-between mb-5">
        {OHAENG_FILTERS.map((o) => (
          <button key={o.key} onClick={() => setSelectedElement(selectedElement === o.key ? null : o.key)}
            className={`flex flex-col items-center gap-1.5 transition-all ${selectedElement === o.key ? "scale-110" : ""}`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border-2 transition-all`}
              style={{
                borderColor: selectedElement === o.key ? o.color : "var(--border)",
                backgroundColor: selectedElement === o.key ? `${o.color}20` : "var(--surface)",
                color: selectedElement === o.key ? o.color : "var(--muted-foreground)",
                boxShadow: selectedElement === o.key ? `0 0 12px ${o.color}40` : "none",
              }}>
              {o.label}
            </div>
            <span className="text-xs font-semibold" style={{ color: selectedElement === o.key ? o.color : undefined }}>
              {ELEMENT_MAP[o.key]?.labelKor}
            </span>
          </button>
        ))}
      </div>

      {/* 결과 수 */}
      <p className="text-xs text-muted-foreground mb-3">{filtered.length}개 작품</p>

      {/* 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.slice(0, 30).map((art) => {
          const el = ELEMENT_MAP[art.element];
          return (
            <div key={art.id} className="group cursor-pointer" onClick={() => navigate(`/artwork/${art.id}`)}>
              <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border mb-2 transition-all group-hover:border-primary/30 group-active:scale-[0.97]">
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

      <TabBar activeTab="explore" />
    </PageContainer>
  );
};

export default ExplorePage;
