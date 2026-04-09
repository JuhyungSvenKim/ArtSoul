-- ════════════════════════════════════════════════════════
-- 유저 프로필 + 역할(role) 시스템
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,          -- Supabase Auth UID 또는 admin ID

    -- 기본 정보
    display_name TEXT NOT NULL DEFAULT '',
    email TEXT,
    phone TEXT,
    avatar_url TEXT,

    -- 실명인증 (PASS)
    real_name TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verification_ci TEXT,                   -- PASS CI 값 (연계정보, 중복가입 방지용)

    -- 소셜 로그인
    provider TEXT,                          -- kakao, apple, naver, admin
    provider_id TEXT,

    -- 역할
    role TEXT NOT NULL DEFAULT 'user'       -- user, admin, superadmin
        CHECK (role IN ('user', 'admin', 'superadmin')),

    -- 마케팅 동의
    marketing_agreed BOOLEAN DEFAULT FALSE,
    terms_agreed_at TIMESTAMPTZ,

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles (email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles (role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_provider ON user_profiles (provider);

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
    ON user_profiles FOR SELECT
    USING (true);

CREATE POLICY "profiles_insert"
    ON user_profiles FOR INSERT
    WITH CHECK (true);

CREATE POLICY "profiles_update_own"
    ON user_profiles FOR UPDATE
    USING (true);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- ════════════════════════════════════════════════════════
-- 코인 충전 패키지
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS coin_packages (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    coins INT NOT NULL,
    price INT NOT NULL,                     -- 원 (KRW)
    bonus_coins INT NOT NULL DEFAULT 0,     -- 보너스 코인
    description TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 패키지 데이터
INSERT INTO coin_packages (name, coins, price, bonus_coins, description, sort_order) VALUES
    ('스타터', 10, 1900, 0, '가볍게 시작', 1),
    ('베이직', 30, 4900, 3, '인기 패키지', 2),
    ('스탠다드', 60, 8900, 10, '가성비 최고', 3),
    ('프리미엄', 120, 15900, 30, '헤비유저 추천', 4),
    ('VIP', 300, 33900, 100, '최대 혜택', 5);

-- ════════════════════════════════════════════════════════
-- 결제 기록
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS payment_records (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    order_id TEXT NOT NULL UNIQUE,           -- 주문 ID (토스페이먼츠)
    payment_key TEXT,                        -- 결제 키 (토스페이먼츠)
    package_id BIGINT REFERENCES coin_packages(id),

    amount INT NOT NULL,                     -- 결제 금액 (KRW)
    coins_purchased INT NOT NULL,            -- 충전 코인
    bonus_coins INT NOT NULL DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'pending'   -- pending, confirmed, failed, cancelled
        CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),

    toss_response JSONB,                     -- 토스 응답 원본
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_order_id ON payment_records (order_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records (status);
