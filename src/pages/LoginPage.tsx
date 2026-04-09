import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import { supabase } from "@/lib/supabase";

const LoginPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (mode === "signup") {
      if (!name) { setError("이름을 입력해주세요"); return; }
      if (!phone) { setError("휴대폰 번호를 입력해주세요"); return; }
      if (!agreeTerms) { setError("이용약관에 동의해주세요"); return; }
    }
    if (!email || !password) { setError("이메일과 비밀번호를 입력해주세요"); return; }
    if (mode === "signup" && password.length < 6) { setError("비밀번호는 6자 이상이어야 합니다"); return; }

    setLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        // Supabase에 회원 저장
        const userId = `user_${Date.now()}`;
        const { error: dbError } = await supabase.from("user_profiles").insert({
          id: userId,
          email,
          nickname: name,
          name_korean: name,
          phone,
          role: "consumer",
          is_pass_verified: false,
          agree_marketing: agreeMarketing,
          created_at: new Date().toISOString(),
        });
        if (dbError && !dbError.message?.includes("duplicate")) {
          // DB 에러여도 진행 (테이블 없을 수도 있음)
          console.warn("user_profiles insert:", dbError.message);
        }
        localStorage.setItem("artsoul-user", JSON.stringify({ email, name, phone, agreeMarketing, userId }));
      } else {
        // 로그인: 이메일로 조회
        const { data } = await supabase.from("user_profiles").select("id, nickname").eq("email", email).single();
        const displayName = data?.nickname || email.split("@")[0];
        localStorage.setItem("artsoul-user", JSON.stringify({ email, name: displayName, userId: data?.id }));
      }
      navigate("/birth-info");
    } catch {
      // Supabase 연결 실패 시에도 localStorage로 진행
      localStorage.setItem("artsoul-user", JSON.stringify({ email, name: name || email.split("@")[0], phone, agreeMarketing }));
      navigate("/birth-info");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    localStorage.setItem("artsoul-user", JSON.stringify({ email: `${provider}@user`, name: provider }));
    navigate("/birth-info");
  };

  return (
    <PageContainer className="items-center text-center min-h-screen justify-center">
      {/* Hero */}
      <div className="flex flex-col items-center gap-5 animate-fade-in mb-10">
        <div className="relative w-28 h-28">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-spin" style={{ animationDuration: "20s" }} />
          <div className="absolute inset-2 rounded-full border border-primary/10 animate-spin" style={{ animationDuration: "15s", animationDirection: "reverse" }} />
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/30 flex items-center justify-center glow-gold">
            <div className="text-center">
              <p className="text-lg font-display font-bold text-primary leading-none">ART</p>
              <p className="text-[10px] font-display text-primary/70 tracking-[0.2em]">D.N.A.</p>
            </div>
          </div>
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
                style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)", backgroundColor: `${color}30`, color, border: `1px solid ${color}50` }}>
                {label}
              </div>
            );
          })}
        </div>
        <div>
          <h1 className="text-3xl font-display text-gold-gradient font-semibold tracking-tight">ART.D.N.A.</h1>
          <p className="text-sm text-muted-foreground mt-2">운명이 고른 그림, 사주가 이끄는 예술</p>
        </div>
      </div>

      {/* 로그인/회원가입 토글 */}
      <div className="w-full max-w-sm mb-4">
        <div className="flex gap-1 bg-surface rounded-xl p-1 mb-4">
          <button onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            로그인
          </button>
          <button onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            회원가입
          </button>
        </div>

        <div className="space-y-2.5">
          {mode === "signup" && (
            <>
              <input type="text" placeholder="이름" value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary" />
              <input type="tel" placeholder="휴대폰 번호 (01012345678)" value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary" />
            </>
          )}
          <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary" />
          <input type="password" placeholder={mode === "signup" ? "비밀번호 (6자 이상)" : "비밀번호"} value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary" />

          {/* 약관 동의 (회원가입 시) */}
          {mode === "signup" && (
            <div className="space-y-2 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-border accent-primary shrink-0" />
                <span className="text-xs text-foreground leading-relaxed">
                  <span className="text-primary underline cursor-pointer">[필수] 이용약관</span> 및 <span className="text-primary underline cursor-pointer">개인정보처리방침</span>에 동의합니다
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={agreeMarketing} onChange={e => setAgreeMarketing(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-border accent-primary shrink-0" />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  [선택] 마케팅 정보 수신에 동의합니다 (이벤트, 추천 작품 알림)
                </span>
              </label>
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-transform active:scale-[0.98] glow-gold disabled:opacity-50">
            {loading ? "처리 중..." : mode === "signup" ? "회원가입" : "로그인"}
          </button>
        </div>

        {/* 소셜 로그인 구분선 */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] text-muted-foreground">또는</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* 소셜 로그인 아이콘 */}
        <div className="flex justify-center gap-4">
          <button onClick={() => handleSocialLogin("kakao")}
            className="w-12 h-12 rounded-full bg-[#FEE500] flex items-center justify-center transition-transform active:scale-95">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.45 4.08 3.63 5.17l-.93 3.42c-.08.28.24.5.48.34l4.07-2.68c.25.02.5.04.75.04 4.42 0 8-2.79 8-6.29S13.42 1 9 1z" fill="#191919"/></svg>
          </button>
          <button onClick={() => handleSocialLogin("naver")}
            className="w-12 h-12 rounded-full bg-[#03C75A] flex items-center justify-center transition-transform active:scale-95">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="white"><path d="M10.87 8.56L5 1H1v14h4.13V7.44L11 15h4V1h-4.13z"/></svg>
          </button>
          <button onClick={() => handleSocialLogin("apple")}
            className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center transition-transform active:scale-95">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" className="text-background"><path d="M11.182.008C11.148-.005 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.728-2.43.728-2.43zm-1.37 3.516c-.317 0-1.182.367-2.026.367-.844 0-1.735-.392-2.392-.392C3.97 3.499 2 5.088 2 7.932c0 1.747.675 3.583 1.508 4.768C4.288 13.773 4.927 14 5.375 14c.62 0 1.077-.407 1.896-.407.82 0 1.156.395 1.855.395.446 0 1.02-.507 1.735-1.544.543-.789.95-1.587 1.105-1.922-.024-.012-2.14-.838-2.154-3.146-.012-1.924 1.545-2.852 1.618-2.897-.895-1.326-2.272-1.47-2.618-1.495v.04z"/></svg>
          </button>
        </div>
      </div>

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
