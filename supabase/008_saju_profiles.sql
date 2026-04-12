-- ════════════════════════════════════════════════════════
-- user_profiles에 사주 기본 정보 추가 + saju_profiles 재정의
-- Supabase SQL Editor에서 실행
-- ════════════════════════════════════════════════════════

-- 1. user_profiles에 사주 입력 정보 컬럼 추가
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS birth_date TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS birth_time TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS mbti TEXT;

-- 2. saju_profiles 테이블 (user_profiles.user_id 연결)
CREATE TABLE IF NOT EXISTS saju_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,  -- user_profiles.user_id와 동일 값

    -- 사주 계산 로우 데이터
    yeonju JSONB,           -- { cheongan, jiji, ohaeng, ... }
    wolju JSONB,
    ilju JSONB,
    siju JSONB,

    -- 분석 결과
    ohaeng_balance JSONB,   -- { 목: n, 화: n, 토: n, 금: n, 수: n }
    yongsin TEXT,            -- 용신 오행
    yongsin_detail JSONB,    -- { yongsin, huisin, gisin, dayStrength, ... }
    gyeokguk TEXT,           -- 격국명
    gyeokguk_detail JSONB,   -- { name, description, baseSipsung }
    sipsung JSONB,           -- 십성 결과
    sinsal JSONB DEFAULT '[]',
    gongmang JSONB,
    relations JSONB DEFAULT '[]',   -- 합충형파해
    daeun JSONB DEFAULT '[]',
    daeun_start_age NUMERIC,
    twelve_stages JSONB,

    -- AI 해석 (코인으로 구매)
    ai_interpretation TEXT,
    ai_interpretation_at TIMESTAMPTZ,

    -- Art DNA
    art_dna JSONB,           -- { dominantOhaeng, recommendedStyles, ... }

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saju_profiles_user_id ON saju_profiles (user_id);

-- RLS
ALTER TABLE saju_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saju_select_all" ON saju_profiles FOR SELECT USING (true);
CREATE POLICY "saju_insert_all" ON saju_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "saju_update_all" ON saju_profiles FOR UPDATE USING (true);

-- 운세 기록 테이블 (user_id를 TEXT로)
CREATE TABLE IF NOT EXISTS fortune_records (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    fortune_type TEXT NOT NULL CHECK (fortune_type IN ('today', 'week', 'month', 'year')),
    cost INT NOT NULL DEFAULT 0,
    result TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fortune_records_user ON fortune_records (user_id, fortune_type);

ALTER TABLE fortune_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fortune_records_select" ON fortune_records FOR SELECT USING (true);
CREATE POLICY "fortune_records_insert" ON fortune_records FOR INSERT WITH CHECK (true);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_saju_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS saju_profiles_updated_at ON saju_profiles;
CREATE TRIGGER saju_profiles_updated_at
    BEFORE UPDATE ON saju_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_saju_updated_at();
