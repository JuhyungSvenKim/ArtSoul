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

  // 소셜 로그인 (Supabase OAuth)
  const handleSocialLogin = async (provider: "kakao" | "apple") => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/api/auth/callback` },
      });
      if (error) setError(error.message);
    } catch {
      // Supabase 미설정 시 → 바로 온보딩으로
      navigate("/birth-info");
    }
  };

  // 네이버 로그인 (수동 OAuth)
  const handleNaverLogin = () => {
    const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
    if (!clientId) {
      navigate("/birth-info");
      return;
    }
    const state = Math.random().toString(36).substring(2);
    const callbackUrl = `${window.location.origin}/api/auth/naver/callback`;
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: callbackUrl,
      state,
    });
    window.location.href = `https://nid.naver.com/oauth2.0/authorize?${params}`;
  };

  // 어드민 로그인
  const handleAdminLogin = async () => {
    if (!adminId || !adminPw) return;
    setLoading(true);
    setError("");
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
      } else {
        setError(data.error || "로그인 실패");
      }
    } catch {
      setError("서버 연결 실패");
    } finally {
      setLoading(false);
    }
  };

  // 둘러보기 (비회원)
  const handleSkip = () => navigate("/birth-info");

  return (
    <PageContainer className="justify-between items-center text-center">
      {/* Logo */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center glow-gold">
          <span className="text-3xl">🎨</span>
        </div>
        <h1 className="text-3xl font-display text-gold-gradient font-semibold tracking-tight">
          ART.D.N.A.
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          DNA × ART, 나만의 예술을 찾다
        </p>
      </div>

      {/* Social Login */}
      <div className="w-full space-y-3 mb-4" style={{ animationDelay: "200ms" }}>
        {/* 카카오 */}
        <button onClick={() => handleSocialLogin("kakao")}
          className="w-full py-3.5 rounded-lg bg-[#FEE500] text-[#191919] font-medium text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.45 4.08 3.63 5.17l-.93 3.42c-.08.28.24.5.48.34l4.07-2.68c.25.02.5.04.75.04 4.42 0 8-2.79 8-6.29S13.42 1 9 1z" fill="#191919"/></svg>
          카카오로 시작하기
        </button>

        {/* 네이버 */}
        <button onClick={handleNaverLogin}
          className="w-full py-3.5 rounded-lg bg-[#03C75A] text-white font-medium text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="white"><path d="M10.87 8.56L5 1H1v14h4.13V7.44L11 15h4V1h-4.13z"/></svg>
          네이버로 시작하기
        </button>

        {/* 애플 */}
        <button onClick={() => handleSocialLogin("apple")}
          className="w-full py-3.5 rounded-lg bg-foreground text-background font-medium text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11.182.008C11.148-.005 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.728-2.43.728-2.43zm-1.37 3.516c-.317 0-1.182.367-2.026.367-.844 0-1.735-.392-2.392-.392C3.97 3.499 2 5.088 2 7.932c0 1.747.675 3.583 1.508 4.768C4.288 13.773 4.927 14 5.375 14c.62 0 1.077-.407 1.896-.407.82 0 1.156.395 1.855.395.446 0 1.02-.507 1.735-1.544.543-.789.95-1.587 1.105-1.922-.024-.012-2.14-.838-2.154-3.146-.012-1.924 1.545-2.852 1.618-2.897-.895-1.326-2.272-1.47-2.618-1.495v.04z"/></svg>
          Apple로 시작하기
        </button>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {/* Admin Login */}
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
          className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors mb-4">
          관리자 로그인
        </button>
      )}

      {/* Skip */}
      <button onClick={handleSkip}
        className="text-xs text-muted-foreground hover:text-primary transition-colors mb-2">
        둘러보기 →
      </button>

      <button className="text-xs text-muted-foreground underline underline-offset-4 mb-4 hover:text-foreground transition-colors">
        이용약관 및 개인정보처리방침
      </button>
    </PageContainer>
  );
};

export default LoginPage;
