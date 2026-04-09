import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import { supabase } from "@/lib/supabase";
import { getCoinPricing, setCoinPricing, type CoinPricing } from "@/lib/coin-pricing";
import {
  MEDIUM_OPTIONS, SUBJECT_OPTIONS, STYLE_OPTIONS, COLOR_OPTIONS, ENERGY_OPTIONS,
  calculateOhaengScores, getPrimaryOhaeng, getAutoEumYang, getAutoEnergyLevel,
  type ArtworkAxes,
} from "@/lib/artwork-ohaeng";

const OHAENG_COLORS: Record<string, string> = {
  목: "bg-green-500", 화: "bg-red-500", 토: "bg-yellow-500", 금: "bg-gray-400", 수: "bg-blue-500",
};
const OHAENG_TEXT: Record<string, string> = {
  목: "text-green-400", 화: "text-red-400", 토: "text-yellow-400", 금: "text-gray-300", 수: "text-blue-400",
};

type ViewMode = "list" | "create" | "artists" | "users" | "settings";

interface ArtistApplication {
  portfolio: string;
  intro: string;
  appliedAt: string;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ViewMode>("list");
  const [artworks, setArtworks] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 기본 정보
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [rentalPrice, setRentalPrice] = useState("");
  const [sizeCmW, setSizeCmW] = useState("");
  const [sizeCmH, setSizeCmH] = useState("");

  // 5축
  const [medium, setMedium] = useState("유화");
  const [subject, setSubject] = useState("자연풍경");
  const [style, setStyle] = useState("사실주의");
  const [color, setColor] = useState("뉴트럴");
  const [energy, setEnergy] = useState("균형");

  // 자동 계산
  const axes: ArtworkAxes = { medium, subject, style, color, energy };
  const ohaengScores = useMemo(() => calculateOhaengScores(axes), [medium, subject, style, color, energy]);
  const { primary, secondary } = useMemo(() => getPrimaryOhaeng(ohaengScores), [ohaengScores]);
  const eumYang = useMemo(() => getAutoEumYang(axes), [medium, subject, style, color, energy]);
  const energyLevel = useMemo(() => getAutoEnergyLevel(ohaengScores), [ohaengScores]);

  useEffect(() => { loadArtworks(); }, []);

  const loadArtworks = async () => {
    const { data } = await supabase.from("artworks").select("*").order("created_at", { ascending: false });
    if (data) setArtworks(data);
  };

  const resetForm = () => {
    setTitle(""); setArtistName(""); setImageUrl(""); setDescription("");
    setPrice(""); setRentalPrice(""); setSizeCmW(""); setSizeCmH("");
    setMedium("유화"); setSubject("자연풍경"); setStyle("사실주의");
    setColor("뉴트럴"); setEnergy("균형");
  };

  const handleSubmit = async () => {
    if (!title || !artistName) { setError("제목과 작가명은 필수입니다"); return; }
    setSaving(true); setError(null); setSuccess(null);

    try {
      const { error: dbError } = await supabase.from("artworks").insert({
        title, artist_name: artistName,
        artist_id: "00000000-0000-0000-0000-000000000000",
        genre: medium, description: description || null,
        image_url: imageUrl || null,
        image_urls: imageUrl ? [imageUrl] : [],
        thumbnail_url: imageUrl || "",
        price: Number(price) || 0,
        rental_price: rentalPrice ? Number(rentalPrice) : null,
        size_cm_w: Number(sizeCmW) || 30, size_cm_h: Number(sizeCmH) || 40,
        ohaeng_scores: ohaengScores,
        primary_ohaeng: primary, secondary_ohaeng: secondary,
        eum_yang: eumYang, energy_level: energyLevel,
        style_tags: [style, medium],
        mood_tags: [color, energy],
        ohaeng_tags: [primary, secondary],
        color_palette: [], recommended_space: [], related_sinsal: [], recommended_effects: [],
        is_admin_uploaded: true, is_demo: false, status: "available",
      });
      if (dbError) throw dbError;
      setSuccess("작품이 등록되었습니다!");
      resetForm(); loadArtworks();
      setTimeout(() => { setSuccess(null); setMode("list"); }, 1500);
    } catch (e: any) { setError(e.message || "등록 실패"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await supabase.from("artworks").delete().eq("id", id);
    loadArtworks();
  };

  // ── 작가 승인 관련 ────────────────────────────
  const [applications, setApplications] = useState<Array<{ key: string; data: ArtistApplication }>>([]);

  useEffect(() => {
    if (mode === "artists") {
      // 실제로는 DB에서 조회. 지금은 데모용 localStorage 기반.
      const apps: Array<{ key: string; data: ArtistApplication }> = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("artsoul-artist-application")) {
          try {
            apps.push({ key, data: JSON.parse(localStorage.getItem(key) || "{}") });
          } catch {}
        }
      }
      setApplications(apps);
    }
  }, [mode]);

  const approveArtist = (key: string) => {
    localStorage.setItem("artsoul-artist-status", "artist");
    setApplications(prev => prev.filter(a => a.key !== key));
    setSuccess("작가 승인 완료!");
    setTimeout(() => setSuccess(null), 2000);
  };

  const rejectArtist = (key: string) => {
    localStorage.removeItem(key);
    localStorage.setItem("artsoul-artist-status", "none");
    setApplications(prev => prev.filter(a => a.key !== key));
  };

  // ── 작품 삭제 ────────────────────────────────
  const deleteArtwork = async (id: string) => {
    if (!confirm("이 작품을 삭제하시겠습니까?")) return;
    try {
      await supabase.from("artworks").delete().eq("id", id);
      setArtworks(prev => prev.filter(a => a.id !== id));
      setSuccess("작품이 삭제되었습니다");
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError("삭제 실패");
    }
  };

  return (
    <PageContainer className="pt-20">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">← 뒤로</button>
        <h1 className="text-lg font-display text-gold-gradient font-semibold">어드민</h1>
        <div className="w-10" />
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-5 bg-surface rounded-xl p-1 overflow-x-auto">
        {([
          { key: "list" as ViewMode, label: "작품" },
          { key: "create" as ViewMode, label: "등록" },
          { key: "artists" as ViewMode, label: "작가" },
          { key: "users" as ViewMode, label: "회원" },
          { key: "settings" as ViewMode, label: "설정" },
        ]).map((tab) => (
          <button key={tab.key} onClick={() => setMode(tab.key)}
            className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              mode === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>{tab.label}</button>
        ))}
      </div>

      {error && <div className="rounded-lg bg-red-500/20 text-red-400 px-3 py-2 text-xs mb-4">{error}</div>}
      {success && <div className="rounded-lg bg-green-500/20 text-green-400 px-3 py-2 text-xs mb-4">{success}</div>}

      {/* ── 목록 ─────────────────────────────────── */}
      {mode === "list" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">등록된 작품: {artworks.length}개</p>
          {artworks.map((art) => (
            <div key={art.id} className="bg-surface border border-border rounded-xl p-3 flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-card border border-border flex items-center justify-center text-xl shrink-0 overflow-hidden">
                {art.image_url ? <img src={art.image_url} alt="" className="w-full h-full object-cover" /> : "🖼️"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{art.title}</p>
                <p className="text-[10px] text-muted-foreground">{art.artist_name} · {art.genre}</p>
                <div className="flex gap-1 mt-1">
                  {art.primary_ohaeng && <span className={`w-3 h-3 rounded-full ${OHAENG_COLORS[art.primary_ohaeng] || ""}`} />}
                  {art.secondary_ohaeng && <span className={`w-3 h-3 rounded-full ${OHAENG_COLORS[art.secondary_ohaeng] || ""} opacity-50`} />}
                  <span className="text-[9px] text-muted-foreground">{art.eum_yang} · {art.energy_level}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(art.id)} className="text-[10px] text-red-400 hover:text-red-300">삭제</button>
            </div>
          ))}
          {artworks.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">등록된 작품이 없습니다</p>}
        </div>
      )}

      {/* ── 등록 폼 ──────────────────────────────── */}
      {mode === "create" && (
        <div className="space-y-6 pb-8">

          {/* 기본 정보 */}
          <FormSection title="기본 정보">
            <Input label="제목 *" value={title} onChange={setTitle} />
            <Input label="작가명 *" value={artistName} onChange={setArtistName} />
            <Input label="이미지 URL" value={imageUrl} onChange={setImageUrl} placeholder="https://..." />
            <Input label="작품 설명" value={description} onChange={setDescription} multiline />
            <div className="grid grid-cols-2 gap-2">
              <Input label="가격 (원)" value={price} onChange={setPrice} type="number" />
              <Input label="렌탈가 (원)" value={rentalPrice} onChange={setRentalPrice} type="number" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input label="가로 (cm)" value={sizeCmW} onChange={setSizeCmW} type="number" />
              <Input label="세로 (cm)" value={sizeCmH} onChange={setSizeCmH} type="number" />
            </div>
          </FormSection>

          {/* 5축 분류 */}
          <FormSection title="작품 5축 분류">
            <p className="text-[10px] text-muted-foreground -mt-1 mb-2">각 축에서 가장 가까운 항목을 선택하세요. 사주 연결은 자동으로 계산됩니다.</p>

            <AxisSelector label="1. Medium (재료 · 물성)" options={MEDIUM_OPTIONS} selected={medium} onSelect={setMedium} />
            <AxisSelector label="2. Subject (소재 · 상징)" options={SUBJECT_OPTIONS} selected={subject} onSelect={setSubject} />
            <AxisSelector label="3. Style (표현 코드)" options={STYLE_OPTIONS} selected={style} onSelect={setStyle} />
            <AxisSelector label="4. Color & Tone (색 · 톤)" options={COLOR_OPTIONS} selected={color} onSelect={setColor} />
            <AxisSelector label="5. Composition & Energy (구도 · 기운)" options={ENERGY_OPTIONS} selected={energy} onSelect={setEnergy} />
          </FormSection>

          {/* 자동 계산 결과 (실시간 프리뷰) */}
          <FormSection title="사주 연결 (자동 계산)">
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              {/* 오행 점수 바 */}
              <div>
                <p className="text-[10px] text-muted-foreground mb-2">오행 점수 (총 {Object.values(ohaengScores).reduce((a, b) => a + b, 0)}점)</p>
                <div className="flex gap-1">
                  {(Object.entries(ohaengScores) as [string, number][]).map(([oh, score]) => (
                    <div key={oh} className="flex-1 text-center">
                      <div className="relative bg-surface rounded-md overflow-hidden h-8">
                        <div className={`absolute bottom-0 left-0 right-0 ${OHAENG_COLORS[oh]} transition-all`}
                          style={{ height: `${Math.min(score, 100)}%` }} />
                        <span className={`relative text-xs font-bold ${OHAENG_TEXT[oh]}`}>{score}</span>
                      </div>
                      <p className={`text-[9px] mt-0.5 ${OHAENG_TEXT[oh]}`}>{oh}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 자동 판별 결과 */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full ${OHAENG_COLORS[primary]}/20 ${OHAENG_TEXT[primary]}`}>
                  주 오행: {primary}
                </span>
                <span className={`px-2 py-0.5 rounded-full ${OHAENG_COLORS[secondary]}/20 ${OHAENG_TEXT[secondary]} opacity-70`}>
                  보조: {secondary}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface text-muted-foreground">
                  {eumYang} · {energyLevel}
                </span>
              </div>
            </div>
          </FormSection>

          <button onClick={handleSubmit} disabled={saving}
            className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all active:scale-[0.98] disabled:opacity-40">
            {saving ? "등록 중..." : "작품 등록"}
          </button>
        </div>
      )}

      {/* ── 작가 승인 ──────────────────────────────── */}
      {mode === "artists" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">대기 중인 작가 신청: {applications.length}건</p>

          {applications.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">대기 중인 신청이 없습니다</p>
            </div>
          )}

          {applications.map((app) => (
            <div key={app.key} className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">작가 신청</p>
                  <p className="text-[10px] text-muted-foreground">
                    신청일: {app.data.appliedAt ? new Date(app.data.appliedAt).toLocaleDateString("ko-KR") : "—"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveArtist(app.key)}
                    className="px-4 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/20">
                    승인
                  </button>
                  <button onClick={() => rejectArtist(app.key)}
                    className="px-4 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20">
                    거절
                  </button>
                </div>
              </div>

              {app.data.portfolio && (
                <div className="mb-2">
                  <p className="text-[10px] text-muted-foreground mb-0.5">포트폴리오</p>
                  <a href={app.data.portfolio} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline break-all">{app.data.portfolio}</a>
                </div>
              )}

              {app.data.intro && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">작가 소개</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">{app.data.intro}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── 회원 관리 ──────────────────────────────── */}
      {mode === "users" && <UserManagement onMessage={(msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 2000); }} />}

      {/* ── 설정 (코인 비용) ──────────────────────────── */}
      {mode === "settings" && <CoinPricingSettings onSave={() => { setSuccess("설정이 저장되었습니다"); setTimeout(() => setSuccess(null), 2000); }} />}
    </PageContainer>
  );
};

// ── 코인 비용 설정 컴포넌트 ────────────────────────
function CoinPricingSettings({ onSave }: { onSave: () => void }) {
  const [pricing, setPricingState] = useState<CoinPricing>(getCoinPricing);

  const update = (key: keyof CoinPricing, value: number) => {
    setPricingState(prev => ({ ...prev, [key]: Math.max(0, value) }));
  };

  const handleSave = () => {
    setCoinPricing(pricing);
    onSave();
  };

  const fields: { key: keyof CoinPricing; label: string; icon: string }[] = [
    { key: "aiInterpretation", label: "AI 사주 해석", icon: "🔮" },
    { key: "fortuneToday", label: "오늘의 운세", icon: "☀️" },
    { key: "fortuneWeek", label: "금주의 운세", icon: "📅" },
    { key: "fortuneMonth", label: "월간 운세", icon: "🗓️" },
    { key: "fortuneYear", label: "올해 운세", icon: "🎯" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-foreground mb-1">코인 비용 설정</p>
        <p className="text-xs text-muted-foreground">각 기능에 필요한 코인 수를 설정합니다. 0으로 설정하면 무료입니다.</p>
      </div>

      <div className="space-y-3">
        {fields.map(({ key, label, icon }) => (
          <div key={key} className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">{icon}</span>
              <span className="text-sm text-foreground">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => update(key, pricing[key] - 1)}
                className="w-8 h-8 rounded-lg bg-card border border-border text-foreground flex items-center justify-center hover:border-primary/30">−</button>
              <span className="w-10 text-center text-sm font-bold text-primary">{pricing[key]}</span>
              <button onClick={() => update(key, pricing[key] + 1)}
                className="w-8 h-8 rounded-lg bg-card border border-border text-foreground flex items-center justify-center hover:border-primary/30">+</button>
              <span className="text-xs text-muted-foreground ml-1">코인</span>
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleSave}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm">
        설정 저장
      </button>
    </div>
  );
}

// ── 회원 관리 컴포넌트 ────────────────────────────
interface ManagedUser {
  id: string;
  email: string | null;
  nickname: string;
  name_korean: string;
  role: string;
  is_pass_verified: boolean;
  created_at: string;
  phone?: string;
}

function UserManagement({ onMessage }: { onMessage: (msg: string) => void }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editVerified, setEditVerified] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("user_profiles")
      .select("id, email, nickname, name_korean, role, is_pass_verified, created_at, phone")
      .order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.nickname?.toLowerCase().includes(q)) ||
      (u.email?.toLowerCase().includes(q)) ||
      (u.name_korean?.toLowerCase().includes(q));
  });

  const openEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setEditRole(user.role || "consumer");
    setEditVerified(user.is_pass_verified || false);
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    await supabase.from("user_profiles").update({
      role: editRole,
      is_pass_verified: editVerified,
    }).eq("id", editingUser.id);
    setEditingUser(null);
    onMessage("회원 정보가 수정되었습니다");
    loadUsers();
  };

  const deleteUser = async (user: ManagedUser) => {
    if (!confirm(`${user.nickname || user.email || "이 회원"}을(를) 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    await supabase.from("user_profiles").delete().eq("id", user.id);
    onMessage("회원이 삭제되었습니다");
    loadUsers();
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case "artist": return "작가";
      case "both": return "작가+소비자";
      default: return "소비자";
    }
  };

  return (
    <div className="space-y-4">
      {/* 검색 & 요약 */}
      <div className="flex items-center gap-2">
        <input type="text" placeholder="이름, 이메일로 검색..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary" />
        <button onClick={loadUsers} className="px-3 py-2.5 rounded-lg bg-surface border border-border text-xs text-muted-foreground hover:text-foreground">
          새로고침
        </button>
      </div>

      <p className="text-xs text-muted-foreground">전체 회원: {users.length}명 {search && `· 검색 결과: ${filtered.length}명`}</p>

      {loading && <p className="text-sm text-muted-foreground text-center py-8">불러오는 중...</p>}

      {/* 회원 목록 */}
      {!loading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          {search ? "검색 결과가 없습니다" : "등록된 회원이 없습니다"}
        </p>
      )}

      {!loading && filtered.map((user) => (
        <div key={user.id} className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.name_korean || user.nickname || "—"}
                </p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                  user.role === "artist" || user.role === "both"
                    ? "bg-primary/10 text-primary"
                    : "bg-surface text-muted-foreground"
                }`}>{roleLabel(user.role)}</span>
                {user.is_pass_verified && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 shrink-0">인증완료</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{user.email || "이메일 없음"}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                가입일: {new Date(user.created_at).toLocaleDateString("ko-KR")}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0 ml-3">
              <button onClick={() => openEdit(user)}
                className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium hover:bg-primary/20">
                수정
              </button>
              <button onClick={() => deleteUser(user)}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-medium hover:bg-red-500/20">
                삭제
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* 수정 모달 */}
      {editingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditingUser(null)} />
          <div className="relative z-10 mx-6 w-full max-w-sm bg-card border border-border rounded-2xl p-6">
            <h3 className="text-base font-semibold text-foreground mb-1">회원 정보 수정</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {editingUser.name_korean || editingUser.nickname} ({editingUser.email})
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">역할</label>
                <div className="flex gap-1.5">
                  {(["consumer", "artist", "both"] as const).map(role => (
                    <button key={role} onClick={() => setEditRole(role)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                        editRole === role
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/20"
                      }`}>{roleLabel(role)}</button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={editVerified} onChange={e => setEditVerified(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-primary" />
                <span className="text-sm text-foreground">본인인증 완료</span>
              </label>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditingUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm">
                취소
              </button>
              <button onClick={saveEdit}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm">
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 하위 컴포넌트 ──────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <div className="w-1 h-4 bg-primary rounded-full" />{title}
      </h3>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", multiline }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; multiline?: boolean;
}) {
  const cls = "w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors";
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}

function AxisSelector({ label, options, selected, onSelect }: {
  label: string; options: readonly { value: string; label: string; desc?: string }[]; selected: string; onSelect: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs text-foreground font-medium mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => (
          <button key={o.value} onClick={() => onSelect(o.value)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left ${
              selected === o.value
                ? "bg-primary/10 border-primary/30 text-primary font-medium"
                : "border-border text-muted-foreground hover:border-primary/20"
            }`}>
            <span>{o.label}</span>
            {o.desc && <span className="block text-[9px] opacity-60 mt-0.5">{o.desc}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default AdminPage;
