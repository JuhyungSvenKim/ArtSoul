import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import GenderSelect from "@/components/GenderSelect";
import { useOnboardingStore } from "@/stores/onboarding";
import { createUser } from "@/services/onboarding";
import { saveBirthInfo } from "@/services/saju-profile";
import { supabase } from "@/lib/supabase";

// ── 위치 기반 시간대 자동 감지 ────────────────────────
const TIMEZONE_LABELS: Record<string, string> = {
  "Asia/Seoul": "KST 한국표준시 (UTC+9)",
  "Asia/Tokyo": "JST 일본표준시 (UTC+9)",
  "Asia/Shanghai": "CST 중국표준시 (UTC+8)",
  "Asia/Bangkok": "ICT 인도차이나 (UTC+7)",
  "Asia/Kolkata": "IST 인도표준시 (UTC+5:30)",
  "Europe/Berlin": "CET 중부유럽 (UTC+1)",
  "Europe/London": "GMT 그리니치 (UTC+0)",
  "America/New_York": "EST 미국동부 (UTC-5)",
  "America/Chicago": "CST 미국중부 (UTC-6)",
  "America/Los_Angeles": "PST 미국서부 (UTC-8)",
};

function getTimezoneLabel(tz: string): string {
  return TIMEZONE_LABELS[tz] || tz;
}

const BirthInfoPage = () => {
  const navigate = useNavigate();
  const { setBirthInfo, setUserId } = useOnboardingStore();

  const [birthDigits, setBirthDigits] = useState("");
  const [timeDigits, setTimeDigits] = useState("");
  const [unknownTime, setUnknownTime] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Seoul");
  const [tzDetected, setTzDetected] = useState(false);

  const [name, setName] = useState("");
  const [hanjaMode, setHanjaMode] = useState<"meaning" | "direct">("meaning");
  const [hanjaSurname, setHanjaSurname] = useState("");
  const [hanjaName1, setHanjaName1] = useState("");
  const [hanjaName2, setHanjaName2] = useState("");
  const [hanjaDirectInput, setHanjaDirectInput] = useState("");

  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 소셜 로그인 추가 정보
  const [isSocialUser, setIsSocialUser] = useState(false);
  const [socialProvider, setSocialProvider] = useState("");
  const [phone, setPhone] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [needsExtra, setNeedsExtra] = useState(false);

  // OAuth 소셜 로그인 후 세션 처리
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const user = session.user;
        const userId = user.id;
        const displayName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "";
        const email = user.email || "";
        const provider = user.app_metadata?.provider || "";

        localStorage.setItem("artsoul-user", JSON.stringify({ email, name: displayName, userId, provider }));
        setUserId(userId);
        setIsSocialUser(true);
        setSocialProvider(provider);

        // DB에서 기존 프로필 확인 → 전화번호 없으면 추가 입력 필요
        supabase.from("user_profiles").select("phone, marketing_agreed")
          .eq("user_id", userId).single().then(({ data }) => {
            if (!data?.phone) {
              setNeedsExtra(true);
            } else {
              setNeedsExtra(false);
            }
          });

        // user_profiles에 upsert (기본 정보만)
        supabase.from("user_profiles").upsert({
          user_id: userId,
          display_name: displayName,
          email,
          provider,
          role: "user",
        }, { onConflict: "user_id" }).then(() => {});

        if (displayName && !name) setName(displayName);
      }
    });
  }, []);

  // 포맷
  const birthFormatted = (() => {
    const d = birthDigits;
    if (d.length <= 4) return d;
    if (d.length <= 6) return d.slice(0, 4) + "-" + d.slice(4);
    return d.slice(0, 4) + "-" + d.slice(4, 6) + "-" + d.slice(6);
  })();

  const birthDate = birthDigits.length === 8
    ? `${birthDigits.slice(0, 4)}-${birthDigits.slice(4, 6)}-${birthDigits.slice(6)}`
    : "";

  const timeFormatted = (() => {
    const d = timeDigits;
    if (d.length <= 2) return d;
    return d.slice(0, 2) + ":" + d.slice(2);
  })();

  const birthTime = timeDigits.length >= 3
    ? `${timeDigits.slice(0, 2)}:${timeDigits.slice(2).padEnd(2, "0")}`
    : "";

  const isValid = birthDate && name && gender && (birthTime || unknownTime);

  // 위치 기반 시간대 자동 감지
  useEffect(() => {
    try {
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (browserTz) {
        setTimezone(browserTz);
        setTzDetected(true);
      }
    } catch {}
  }, []);

  const hanjaName = hanjaMode === "direct"
    ? hanjaDirectInput || null
    : [hanjaSurname, hanjaName1, hanjaName2].filter(Boolean).join(" ") || null;

  const handleNext = () => {
    if (!isValid || !gender) return;

    // 소셜 유저 추가 정보 검증
    if (isSocialUser && needsExtra) {
      if (!agreeTerms) { setError("이용약관에 동의해주세요"); return; }
      if (!phone) { setError("휴대폰 번호를 입력해주세요"); return; }
      // 추가 정보 DB 저장
      const userId = JSON.parse(localStorage.getItem("artsoul-user") || "{}").userId;
      if (userId) {
        supabase.from("user_profiles").update({
          phone,
          marketing_agreed: agreeMarketing,
        }).eq("user_id", userId).then(() => {});
      }
    }

    const data = {
      birthDate,
      birthTime: unknownTime ? null : birthTime || null,
      nameKorean: name,
      nameHanja: hanjaName,
      gender,
    };

    // 모든 곳에 저장 (3중 보장)
    try { localStorage.setItem("artsoul-saju-input", JSON.stringify(data)); } catch {}
    setBirthInfo(data);
    createUser(data).then(user => setUserId(user.id)).catch(() => {});
    saveBirthInfo({ birthDate, birthTime: unknownTime ? null : birthTime || null, gender: gender! }).catch(() => {});

    // URL hash로 데이터 인코딩해서 전달
    const hash = btoa(encodeURIComponent(JSON.stringify(data)));
    navigate(`/mbti#${hash}`);
  };

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-xl font-display text-gold-gradient font-semibold">
          사주 정보 입력
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          정확한 생년월일시를 입력하면 맞춤 예술을 찾아드립니다
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/20 text-red-400 px-3 py-2 text-xs font-medium mb-4">
          {error}
        </div>
      )}

      {/* 소셜 로그인 유저 — 추가 정보 입력 */}
      {isSocialUser && needsExtra && (
        <div className="bg-card border border-primary/20 rounded-xl p-4 mb-5 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">
              {socialProvider === "kakao" ? "카카오" : socialProvider === "google" ? "구글" : "애플"} 로그인 환영해요!
            </p>
            <p className="text-xs text-muted-foreground">서비스 이용을 위해 몇 가지만 더 알려주세요</p>
          </div>

          <input type="tel" placeholder="휴대폰 번호 (01012345678)" value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
            className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary" />

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-border accent-primary shrink-0" />
            <span className="text-xs text-foreground leading-relaxed">
              <span className="text-primary">[필수]</span> 이용약관 및 개인정보처리방침에 동의합니다
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" checked={agreeMarketing} onChange={e => setAgreeMarketing(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-border accent-primary shrink-0" />
            <span className="text-xs text-muted-foreground leading-relaxed">
              [선택] 마케팅 정보 수신에 동의합니다
            </span>
          </label>

          {isSocialUser && needsExtra && !agreeTerms && (
            <p className="text-[10px] text-red-400">이용약관 동의가 필요합니다</p>
          )}
        </div>
      )}

      <form className="space-y-5 flex-1" onSubmit={(e) => e.preventDefault()}>
        {/* 한글 이름 */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-foreground">이름 *</label>
          <input type="text" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors" />
        </section>

        {/* 한자 이름 */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-foreground">한자 이름 <span className="text-muted-foreground font-normal">(선택)</span></label>

          {/* 입력 방식 토글 */}
          <div className="flex gap-1 bg-surface rounded-lg p-0.5">
            <button type="button" onClick={() => setHanjaMode("meaning")}
              className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                hanjaMode === "meaning" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}>
              뜻풀이 입력
            </button>
            <button type="button" onClick={() => setHanjaMode("direct")}
              className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                hanjaMode === "direct" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}>
              한자 직접 입력
            </button>
          </div>

          {hanjaMode === "meaning" ? (
            <>
              <p className="text-[10px] text-muted-foreground">각 글자의 한자 뜻을 한글로 풀어서 입력하세요</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: hanjaSurname, set: setHanjaSurname, ph: "넓을홍", label: "성" },
                  { value: hanjaName1, set: setHanjaName1, ph: "길길", label: "이름 1" },
                  { value: hanjaName2, set: setHanjaName2, ph: "아이동", label: "이름 2" },
                ].map((f) => (
                  <div key={f.label}>
                    <input type="text" placeholder={f.ph} value={f.value} onChange={(e) => f.set(e.target.value)}
                      className="w-full px-3 py-3 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors text-center" />
                    <p className="text-[10px] text-muted-foreground mt-1 text-center">{f.label}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-[10px] text-muted-foreground">한자를 직접 입력하세요 (PC에서 한자 변환 추천)</p>
              <input type="text" placeholder="洪吉童" value={hanjaDirectInput}
                onChange={(e) => setHanjaDirectInput(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors text-center" />
            </>
          )}

          {hanjaName && (
            <p className="text-xs text-primary">입력: {hanjaName}</p>
          )}
        </section>

        {/* 생년월일 */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-foreground">생년월일 *</label>
          <input type="tel" placeholder="19901231" value={birthFormatted}
            onChange={(e) => setBirthDigits(e.target.value.replace(/\D/g, "").slice(0, 8))}
            className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors" />
          {birthDate && <p className="text-xs text-primary">{birthDate}</p>}
        </section>

        {/* 태어난 시간 */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">태어난 시간 *</label>
            <details className="relative">
              <summary className="text-[10px] text-primary cursor-pointer hover:underline">생시를 모르겠어요?</summary>
              <div className="absolute right-0 top-6 z-10 w-80 sm:w-96 bg-card border border-border rounded-xl p-4 shadow-xl text-left max-h-[70vh] overflow-y-auto">
                <p className="text-xs font-semibold text-foreground mb-3">생시 추정 방법</p>
                <div className="text-[11px] text-muted-foreground space-y-3 leading-relaxed">

                  <p><span className="text-foreground font-medium">1. 부모님께 확인</span><br />출생신고서, 산모수첩, 아기수첩에 기록이 있을 수 있습니다.</p>
                  <p><span className="text-foreground font-medium">2. 병원 기록 조회</span><br />출생 병원에 문의하면 출생 시각을 확인할 수 있습니다.</p>

                  {/* 12시진 표 */}
                  <div className="bg-surface rounded-lg p-2.5">
                    <p className="text-[10px] text-foreground font-medium mb-1.5">12시진 기준 (2시간 단위)</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                      <span>子시 23:00~01:00</span><span>午시 11:00~13:00</span>
                      <span>丑시 01:00~03:00</span><span>未시 13:00~15:00</span>
                      <span>寅시 03:00~05:00</span><span>申시 15:00~17:00</span>
                      <span>卯시 05:00~07:00</span><span>酉시 17:00~19:00</span>
                      <span>辰시 07:00~09:00</span><span>戌시 19:00~21:00</span>
                      <span>巳시 09:00~11:00</span><span>亥시 21:00~23:00</span>
                    </div>
                  </div>

                  {/* 체형/습관 기반 추정 */}
                  <div>
                    <p className="text-foreground font-medium mb-1.5">3. 체형·습관으로 추정하기</p>
                    <p className="text-[10px] mb-2">명리학에서는 체형, 성격, 잠자리 습관 등으로 생시를 추정합니다.</p>

                    <div className="space-y-1.5">
                      <div className="bg-surface rounded-lg p-2">
                        <p className="text-[10px] text-foreground font-medium">🌅 寅·卯시 (03~07시) — 새벽형</p>
                        <p className="text-[10px]">키가 크고 마른 편, 일찍 일어남, 아침에 컨디션 좋음, 활동적이고 성격 급함</p>
                      </div>
                      <div className="bg-surface rounded-lg p-2">
                        <p className="text-[10px] text-foreground font-medium">☀️ 辰·巳시 (07~11시) — 오전형</p>
                        <p className="text-[10px]">중간 체형, 사교적, 사람 만나는 걸 좋아함, 계획적이고 부지런함</p>
                      </div>
                      <div className="bg-surface rounded-lg p-2">
                        <p className="text-[10px] text-foreground font-medium">🔆 午·未시 (11~15시) — 한낮형</p>
                        <p className="text-[10px]">얼굴에 혈색이 좋음, 열정적, 남 앞에 서는 걸 좋아함, 더위를 잘 탐</p>
                      </div>
                      <div className="bg-surface rounded-lg p-2">
                        <p className="text-[10px] text-foreground font-medium">🌇 申·酉시 (15~19시) — 오후형</p>
                        <p className="text-[10px]">피부가 하얗거나 깨끗한 편, 꼼꼼하고 예민, 가을을 좋아함, 금속 액세서리 선호</p>
                      </div>
                      <div className="bg-surface rounded-lg p-2">
                        <p className="text-[10px] text-foreground font-medium">🌙 戌·亥시 (19~23시) — 저녁형</p>
                        <p className="text-[10px]">통통하거나 부드러운 체형, 밤에 활발, 생각이 많고 감성적, 물·비를 좋아함</p>
                      </div>
                      <div className="bg-surface rounded-lg p-2">
                        <p className="text-[10px] text-foreground font-medium">🌌 子·丑시 (23~03시) — 심야형</p>
                        <p className="text-[10px]">늦게 자고 늦게 일어남, 직감이 강함, 혼자 있는 시간을 좋아함, 겨울에 오히려 에너지 넘침</p>
                      </div>
                    </div>
                  </div>

                  {/* 잠자리 습관 */}
                  <div>
                    <p className="text-foreground font-medium mb-1.5">4. 잠자리 습관 단서</p>
                    <div className="bg-surface rounded-lg p-2.5 space-y-1 text-[10px]">
                      <p>🛌 <span className="text-foreground">똑바로 자는 편</span> → 午·未시 (한낮)</p>
                      <p>🛌 <span className="text-foreground">옆으로 웅크려 잠</span> → 子·丑시 (심야)</p>
                      <p>🛌 <span className="text-foreground">엎드려 잠</span> → 寅·卯시 (새벽)</p>
                      <p>🛌 <span className="text-foreground">자주 뒤척임</span> → 巳·午시 (화 기운 강)</p>
                      <p>🛌 <span className="text-foreground">이불을 잘 걷어참</span> → 申·酉시 (금 기운, 열 발산)</p>
                    </div>
                  </div>

                  {/* 첫인상 */}
                  <div>
                    <p className="text-foreground font-medium mb-1.5">5. 첫인상·외모 단서</p>
                    <div className="bg-surface rounded-lg p-2.5 space-y-1 text-[10px]">
                      <p>👤 <span className="text-foreground">날카롭고 강한 인상</span> → 寅·卯시 (목 기운)</p>
                      <p>👤 <span className="text-foreground">밝고 화사한 인상</span> → 巳·午시 (화 기운)</p>
                      <p>👤 <span className="text-foreground">후덕하고 편안한 인상</span> → 辰·未·戌·丑시 (토 기운)</p>
                      <p>👤 <span className="text-foreground">차갑고 세련된 인상</span> → 申·酉시 (금 기운)</p>
                      <p>👤 <span className="text-foreground">부드럽고 몽환적 인상</span> → 亥·子시 (수 기운)</p>
                    </div>
                  </div>

                  <p className="text-[10px] text-primary mt-2">위 내용은 참고용입니다. 정확한 시간을 모르면 아래 "모름"을 체크하세요. (정오 12:00 기준 분석)</p>
                </div>
              </div>
            </details>
          </div>
          <input type="tel" placeholder="1430 (24시간제)" value={unknownTime ? "" : timeFormatted}
            onChange={(e) => setTimeDigits(e.target.value.replace(/\D/g, "").slice(0, 4))}
            disabled={unknownTime}
            className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors disabled:opacity-40" />
          {birthTime && !unknownTime && <p className="text-xs text-primary">{birthTime} (24시간제)</p>}
          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input type="checkbox" checked={unknownTime}
              onChange={(e) => { setUnknownTime(e.target.checked); if (e.target.checked) setTimeDigits(""); }}
              className="w-4 h-4 rounded border-border accent-primary" />
            <span className="text-xs text-muted-foreground">태어난 시간을 모릅니다 (정오 12:00 기준 분석)</span>
          </label>
        </section>

        {/* 시간대 (위치 기반 자동 감지) */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-foreground">시간대</label>
          <div className="px-4 py-3 rounded-lg bg-surface border border-border text-sm flex items-center justify-between">
            <span className="text-foreground">{getTimezoneLabel(timezone)}</span>
            {tzDetected && <span className="text-[10px] text-primary">📍 자동 감지됨</span>}
          </div>
          <p className="text-[10px] text-muted-foreground">
            태어난 곳의 시간대가 다르면 눌러서 변경하세요
          </p>
          <details className="text-xs">
            <summary className="text-muted-foreground cursor-pointer hover:text-primary transition-colors">시간대 직접 선택</summary>
            <div className="mt-2 space-y-1">
              {Object.entries(TIMEZONE_LABELS).map(([value, label]) => (
                <button key={value} type="button" onClick={() => { setTimezone(value); setTzDetected(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                    timezone === value ? "bg-primary/10 text-primary border border-primary/20" : "bg-surface text-muted-foreground hover:text-foreground"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </details>
        </section>

        {/* 성별 */}
        <section className="space-y-3">
          <label className="text-sm font-medium text-foreground">성별 *</label>
          <GenderSelect value={gender} onChange={setGender} />
        </section>
      </form>

      <button disabled={!isValid} onClick={handleNext}
        className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm mt-6 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none glow-gold">
        다음
      </button>
    </PageContainer>
  );
};

export default BirthInfoPage;
