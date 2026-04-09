import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import GenderSelect from "@/components/GenderSelect";
import { useOnboardingStore } from "@/stores/onboarding";
import { createUser } from "@/services/onboarding";

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

  const isValid = birthDate && name && gender;

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
          <label className="text-sm font-medium text-foreground">태어난 시간</label>
          <input type="tel" placeholder="1430 (24시간제)" value={unknownTime ? "" : timeFormatted}
            onChange={(e) => setTimeDigits(e.target.value.replace(/\D/g, "").slice(0, 4))}
            disabled={unknownTime}
            className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors disabled:opacity-40" />
          {birthTime && !unknownTime && <p className="text-xs text-primary">{birthTime} (24시간제)</p>}
          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input type="checkbox" checked={unknownTime}
              onChange={(e) => { setUnknownTime(e.target.checked); if (e.target.checked) setTimeDigits(""); }}
              className="w-4 h-4 rounded border-border accent-primary" />
            <span className="text-xs text-muted-foreground">태어난 시간을 모릅니다</span>
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
