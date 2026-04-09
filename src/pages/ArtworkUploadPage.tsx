import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ImagePlus, X, Sparkles, ToggleLeft, ToggleRight } from "lucide-react";

const GENRES = ["수묵담채", "유화", "수채화", "아크릴", "판화", "디지털아트", "혼합매체", "사진", "조각"];

const ArtworkUploadPage = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    genre: "",
    width: "",
    height: "",
    price: "",
    rentalAllowed: true,
  });
  const [aiSuggested, setAiSuggested] = useState(false);
  const [aiPrice, setAiPrice] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const EMOJIS = ["🎨", "🖼️", "🏔️", "🌸", "🌊", "🎋", "🌕", "☁️", "❄️", "🌅"];

  const addMockImage = () => {
    if (images.length >= 5) return;
    const emoji = EMOJIS[images.length % EMOJIS.length];
    setImages([...images, emoji]);
  };

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const requestAiPrice = () => {
    if (!form.genre || !form.width || !form.height) return;
    setAiSuggested(true);
    const base = 800000 + Math.floor(Math.random() * 1200000);
    const rounded = Math.round(base / 10000) * 10000;
    setAiPrice(rounded);
    if (!form.price) setForm({ ...form, price: rounded.toString() });
  };

  const canSubmit = images.length > 0 && form.title && form.genre && form.width && form.height && form.price;

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
    }, 1200);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex justify-center">
        <div className="mobile-container flex flex-col items-center justify-center text-center px-8 space-y-5">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-4xl">
            🎉
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground">작품이 등록되었습니다</h2>
            <p className="text-xs text-muted-foreground mt-1.5">심사 후 탐색 페이지에 노출됩니다</p>
          </div>
          <div className="flex gap-2 w-full max-w-xs">
            <button onClick={() => navigate("/artist-dashboard")} className="flex-1 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              대시보드
            </button>
            <button onClick={() => { setDone(false); setImages([]); setForm({ title: "", description: "", genre: "", width: "", height: "", price: "", rentalAllowed: true }); setAiSuggested(false); setAiPrice(null); }} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
              작품 추가
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="mobile-container flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-display font-semibold text-foreground">작품 업로드</h1>
        </div>

        <div className="flex-1 px-5 pb-32 overflow-y-auto space-y-5">
          {/* Image Picker */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">작품 사진 ({images.length}/5)</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {images.map((emoji, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl bg-surface border border-border flex items-center justify-center text-3xl shrink-0">
                  {emoji}
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button
                  onClick={addMockImage}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors shrink-0"
                >
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-[10px]">추가</span>
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">작품명</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="작품 제목을 입력하세요"
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">작품 설명</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="작품에 대한 설명을 입력하세요"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none resize-none"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">장르</label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => setForm({ ...form, genre: g })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    form.genre === g
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">사이즈 (cm)</label>
            <div className="flex gap-2 items-center">
              <input
                value={form.width}
                onChange={(e) => setForm({ ...form, width: e.target.value })}
                placeholder="가로"
                type="number"
                className="flex-1 px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
              />
              <span className="text-muted-foreground text-sm">×</span>
              <input
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                placeholder="세로"
                type="number"
                className="flex-1 px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
              />
            </div>
          </div>

          {/* AI Price Suggestion */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> AI 가격 제안
              </p>
              <button
                onClick={requestAiPrice}
                disabled={!form.genre || !form.width || !form.height}
                className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium disabled:opacity-40 transition-colors hover:bg-primary/20"
              >
                가격 분석
              </button>
            </div>
            {aiSuggested && aiPrice && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">유사 작품 기반 적정 가격</p>
                <p className="text-lg font-semibold text-primary mt-0.5">₩{aiPrice.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground mt-1">장르, 사이즈, 시장 데이터를 기반으로 산출</p>
              </div>
            )}
          </div>

          {/* Price Input */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">판매가 (원)</label>
            <input
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="판매 가격을 입력하세요"
              type="number"
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
            />
          </div>

          {/* Rental Toggle */}
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <div>
              <p className="text-sm font-medium text-foreground">렌탈 허용</p>
              <p className="text-[10px] text-muted-foreground">작품을 렌탈 서비스에 등록합니다</p>
            </div>
            <button onClick={() => setForm({ ...form, rentalAllowed: !form.rentalAllowed })}>
              {form.rentalAllowed ? (
                <ToggleRight className="w-10 h-10 text-primary" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Bottom Button */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/90 backdrop-blur-xl border-t border-border px-5 py-3 pb-[env(safe-area-inset-bottom,12px)] z-50">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-transform active:scale-[0.98]"
          >
            {submitting ? "등록 중..." : "작품 등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtworkUploadPage;
