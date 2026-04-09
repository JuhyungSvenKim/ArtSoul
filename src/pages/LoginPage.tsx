import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";

const LoginPage = () => {
  const navigate = useNavigate();
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [adminPw, setAdminPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSocialLogin = async (provider: "kakao" | "apple") => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/api/auth/callback` },
      });
      if (error) setError(error.message);
    } catch {
      navigate("/birth-info");
    }
  };

  const handleNaverLogin = () => {
    const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
    if (!clientId) { navigate("/birth-info"); return; }
    const state = Math.random().toString(36).substring(2);
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: `${window.location.origin}/api/auth/naver/callback`,
      state,
    });
    window.location.href = `https://nid.naver.com/oauth2.0/authorize?${params}`;
  };

  const handleAdminLogin = async () => {
    if (!adminId || !adminPw) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: adminId, password: adminPw }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("artsoul_token", data.token);
        localStorage.setItem("artsoul_user", JSON.stringify(data.profile));
        navigate("/admin");
      } else { setError(data.error || "로그인 실패"); }
    } catch { setError("서버 연결 실패"); }
    finally { setLoading(false); }
  };

  return (
    <PageContainer className="justify-between items-center text-center">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 animate-fade-in">
        {/* 로고 — 오행 원형 그래픽 */}
        <div className="relative w-28 h-28">
          {/* 외곽 회전 링 */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-spin" style={{ animationDuration: "20s" }} />
          <div className="absolute inset-2 rounded-full border border-primary/10 animate-spin" style={{ animationDuration: "15s", animationDirection: "reverse" }} />
          {/* 중앙 로고 */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/30 flex items-center justify-center glow-gold">
            <div className="text-center">
              <p className="text-lg font-display font-bold text-primary leading-none">ART</p>
              <p className="text-[10px] font-display text-primary/70 tracking-[0.2em]">D.N.A.</p>
            </div>
          </div>
          {/* 오행 점 */}
          {[
            { color: "#4a9e6e", angle: -90, label: "木" },
            { color: "#d45050", angle: -18, label: "火" },
            { color: "#c49a3c", angle: 54, label: "土" },
            { color: "#a0a0a0", angle: 126, label: "金" },
            { color: "#4a7eb5", angle: 198, label: "水" },
          ].map(({ color, angle, label }) => {
            const rad = (angle * Math.PI) / 180;
            const x = 50 + 46 * Math.cos(rad);
            const y = 50 + 46 * Math.sin(rad);
            return (
              <div key={label} className="absolute w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                style={{
                  left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)",
                  backgroundColor: `${color}30`, color, border: `1px solid ${color}50`,
                }}>
                {label}
              </div>
            );
          })}
        </div>

        <div>
          <h1 className="text-3xl font-display text-gold-gradient font-semibold tracking-tight">
            ART.D.N.A.
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            운명이 고른 그림, 사주가 이끄는 예술
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            DNA × ART — 나만의 예술을 찾다
          </p>
        </div>
      </div>

      {/* Social Login */}
      <div className="w-full space-y-3 mb-4">
        <button onClick={() => handleSocialLogin("kakao")}
          className="w-full py-3.5 rounded-xl bg-[#FEE500] text-[#191919] font-medium text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.45 4.08 3.63 5.17l-.93 3.42c-.08.28.24.5.48.34l4.07-2.68c.25.02.5.04.75.04 4.42 0 8-2.79 8-6.29S13.42 1 9 1z" fill="#191919"/></svg>
          카카오로 시작하기
        </button>

        <button onClick={handleNaverLogin}
          className="w-full py-3.5 rounded-xl bg-[#03C75A] text-white font-medium text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="white"><path d="M10.87 8.56L5 1H1v14h4.13V7.44L11 15h4V1h-4.13z"/></svg>
          네이버로 시작하기
        </button>

        <button onClick={() => handleSocialLogin("apple")}
          className="w-full py-3.5 rounded-xl bg-foreground text-background font-medium text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11.182.008C11.148-.005 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.728-2.43.728-2.43zm-1.37 3.516c-.317 0-1.182.367-2.026.367-.844 0-1.735-.392-2.392-.392C3.97 3.499 2 5.088 2 7.932c0 1.747.675 3.583 1.508 4.768C4.288 13.773 4.927 14 5.375 14c.62 0 1.077-.407 1.896-.407.82 0 1.156.395 1.855.395.446 0 1.02-.507 1.735-1.544.543-.789.95-1.587 1.105-1.922-.024-.012-2.14-.838-2.154-3.146-.012-1.924 1.545-2.852 1.618-2.897-.895-1.326-2.272-1.47-2.618-1.495v.04z"/></svg>
          Apple로 시작하기
        </button>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {/* Admin */}
      {showAdmin ? (
        <div className="w-full space-y-2 mb-4 animate-fade-in">
          <input type="text" placeholder="아이디" value={adminId} onChange={e => setAdminId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground/50" />
          <input type="password" placeholder="비밀번호" value={adminPw} onChange={e => setAdminPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
            className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground/50" />
          <button onClick={handleAdminLogin} disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            {loading ? "로그인 중..." : "어드민 로그인"}
          </button>
        </div>
      ) : (
        <button onClick={() => setShowAdmin(true)}
          className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors mb-3">
          관리자
        </button>
      )}

      <button onClick={() => navigate("/birth-info")}
        className="text-xs text-muted-foreground hover:text-primary transition-colors mb-2">
        둘러보기 →
      </button>

      <p className="text-[10px] text-muted-foreground/40 mb-4">
        시작하면 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다
      </p>
    </PageContainer>
  );
};

export default LoginPage;
