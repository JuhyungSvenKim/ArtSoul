import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import ProgressBar from "@/components/ProgressBar";
import GenderSelect from "@/components/GenderSelect";
import { useOnboardingStore } from "@/stores/onboarding";
import { createUser } from "@/services/onboarding";

// ── 타임존 목록 (주요) ─────────────────────────────
const TIMEZONES = [
  { label: "KST 한국표준시 (UTC+9)", value: "Asia/Seoul", offset: 9 },
  { label: "JST 일본표준시 (UTC+9)", value: "Asia/Tokyo", offset: 9 },
  { label: "CST 중국표준시 (UTC+8)", value: "Asia/Shanghai", offset: 8 },
  { label: "ICT 인도차이나 (UTC+7)", value: "Asia/Bangkok", offset: 7 },
  { label: "IST 인도표준시 (UTC+5:30)", value: "Asia/Kolkata", offset: 5.5 },
  { label: "CET 중부유럽 (UTC+1)", value: "Europe/Berlin", offset: 1 },
  { label: "GMT 그리니치 (UTC+0)", value: "Europe/London", offset: 0 },
  { label: "EST 미국동부 (UTC-5)", value: "America/New_York", offset: -5 },
  { label: "CST 미국중부 (UTC-6)", value: "America/Chicago", offset: -6 },
  { label: "PST 미국서부 (UTC-8)", value: "America/Los_Angeles", offset: -8 },
];

const BirthInfoPage = () => {
  const navigate = useNavigate();
  const { setBirthInfo, setUserId } = useOnboardingStore();

  // 숫자만 저장 (표시는 별도 포맷)
  const [birthDigits, setBirthDigits] = useState("");
  const [timeDigits, setTimeDigits] = useState("");
  const [unknownTime, setUnknownTime] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Seoul");

  const [name, setName] = useState("");
  const [hanjaSurname, setHanjaSurname] = useState("");
  const [hanjaName1, setHanjaName1] = useState("");
  const [hanjaName2, setHanjaName2] = useState("");

  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 포맷된 값 계산
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

  // 초기 로드 시 브라우저 타임존 감지
  useEffect(() => {
    try {
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const match = TIMEZONES.find(tz => tz.value === browserTz);
      if (match) setTimezone(match.value);
    } catch {}
  }, []);

  const handleBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
    setBirthDigits(raw);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    setTimeDigits(raw);
  };

  const hanjaName = [hanjaSurname, hanjaName1, hanjaName2].filter(Boolean).join(" ") || null;

  const handleNext = async () => {
    if (!isValid || !gender) return;
    setSaving(true);
    setError(null);

    const data = {
      birthDate,
      birthTime: unknownTime ? null : birthTime || null,
      nameKorean: name,
      nameHanja: hanjaName,
      gender,
    };

    try {
      const user = await createUser(data);
      setBirthInfo(data);
      setUserId(user.id);
      navigate("/mbti");
    } catch (e: any) {
      console.error("Failed to save birth info:", e);
      setError(e.message || "저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <ProgressBar current={1} total={3} />

      <h1 className="text-xl font-display text-gold-gradient font-semibold mb-6">
        기본 정보 입력
      </h1>

      {error && (
        <div className="rounded-lg bg-red-500/20 text-red-400 px-3 py-2 text-xs font-medium mb-4">
          {error}
        </div>
      )}

      <form className="space-y-6 flex-1" onSubmit={(e) => e.preventDefault()}>
        {/* 생년월일 */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-foreground">생년월일 *</label>
          <input
            type="tel"
            placeholder="YYYYMMDD"
            value={birthFormatted}
            onChange={handleBirthChange}
            className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
          />
          {birthDate && (
            <p className="text-xs text-primary">{birthDate}</p>
          )}
        </section>

        {/* 태어난 시간 */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-foreground">태어난 시간</label>
          <input
            type="tel"
            placeholder="HHMM"
            value={unknownTime ? "" : timeFormatted}
            onChange={handleTimeChange}
            disabled={unknownTime}
            className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors disabled:opacity-40"
          />
          {birthTime && !unknownTime && (
            <p className="text-xs text-primary">{birthTime} (24시간제)</p>
          )}

          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={unknownTime}
              onChange={(e) => {
                setUnknownTime(e.target.checked);
                if (e.target.checked) setTimeDigits("");
              }}
              className="w-4 h-4 rounded border-border accent-primary"
            />
            <span className="text-xs text-muted-foreground">태어난 시간을 모릅니다</span>
          </label>
        </section>

        {/* 시간대 */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">시간대</label>
            <button
              type="button"
              onClick={() => {
                try {
                  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                  const match = TIMEZONES.find(t => t.value === tz);
                  if (match) setTimezone(match.value);
                } catch {}
              }}
              className="text-[10px] text-primary hover:text-primary/80 transition-colors"
            >
              📍 현재 위치로 설정
            </button>
          </div>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-primary transition-colors appearance-none"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </section>

        {/* 한글 이름 */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-foreground">한글 이름 *</label>
          <input
            type="text"
            placeholder="홍길동"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
          />
        </section>

        {/* 한자 이름 */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-foreground">한자 이름 (선택)</label>
          <p className="text-[10px] text-muted-foreground">각 글자의 한자 뜻풀이를 입력해주세요</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <input
                type="text"
                placeholder="넓을홍"
                value={hanjaSurname}
                onChange={(e) => setHanjaSurname(e.target.value)}
                className="w-full px-3 py-3 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors text-center"
              />
              <p className="text-[10px] text-muted-foreground mt-1 text-center">성</p>
            </div>
            <div>
              <input
                type="text"
                placeholder="길길"
                value={hanjaName1}
                onChange={(e) => setHanjaName1(e.target.value)}
                className="w-full px-3 py-3 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors text-center"
              />
              <p className="text-[10px] text-muted-foreground mt-1 text-center">이름 1</p>
            </div>
            <div>
              <input
                type="text"
                placeholder="어린아이동"
                value={hanjaName2}
                onChange={(e) => setHanjaName2(e.target.value)}
                className="w-full px-3 py-3 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors text-center"
              />
              <p className="text-[10px] text-muted-foreground mt-1 text-center">이름 2</p>
            </div>
          </div>
          {hanjaName && (
            <p className="text-xs text-primary mt-1">입력: {hanjaName}</p>
          )}
        </section>

        {/* 성별 */}
        <section className="space-y-3">
          <label className="text-sm font-medium text-foreground">성별 *</label>
          <GenderSelect value={gender} onChange={setGender} />
        </section>
      </form>

      <button
        disabled={!isValid || saving}
        onClick={handleNext}
        className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm mt-6 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
      >
        {saving ? "저장 중..." : "다음"}
      </button>
      <button
        onClick={() => navigate("/home")}
        className="w-full py-2 text-xs text-muted-foreground hover:text-primary transition-colors mt-2"
      >
        건너뛰고 메인으로 →
      </button>
    </PageContainer>
  );
};

export default BirthInfoPage;
