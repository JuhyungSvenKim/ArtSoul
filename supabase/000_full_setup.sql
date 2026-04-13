-- ════════════════════════════════════════════════════════
-- ART.D.N.A. 전체 테이블 생성 (충돌 방지 — DROP POLICY 후 재생성)
-- Supabase SQL Editor에서 한 번에 실행
-- ════════════════════════════════════════════════════════

-- 1. user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    display_name TEXT,
    email TEXT,
    phone TEXT,
    provider TEXT DEFAULT 'email',
    role TEXT DEFAULT 'user',
    is_verified BOOLEAN DEFAULT FALSE,
    marketing_agreed BOOLEAN DEFAULT FALSE,
    birth_date TEXT,
    birth_time TEXT,
    gender TEXT,
    mbti TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete" ON user_profiles;
CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE USING (true);
CREATE POLICY "user_profiles_delete" ON user_profiles FOR DELETE USING (true);

-- 2. saju_profiles
CREATE TABLE IF NOT EXISTS saju_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    yeonju JSONB, wolju JSONB, ilju JSONB, siju JSONB,
    ohaeng_balance JSONB, yongsin TEXT, yongsin_detail JSONB,
    gyeokguk TEXT, gyeokguk_detail JSONB, sipsung JSONB,
    sinsal JSONB DEFAULT '[]', gongmang JSONB,
    relations JSONB DEFAULT '[]', daeun JSONB DEFAULT '[]',
    daeun_start_age NUMERIC, twelve_stages JSONB,
    ai_interpretation TEXT, ai_interpretation_at TIMESTAMPTZ,
    art_dna JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE saju_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saju_select_all" ON saju_profiles;
DROP POLICY IF EXISTS "saju_insert_all" ON saju_profiles;
DROP POLICY IF EXISTS "saju_update_all" ON saju_profiles;
CREATE POLICY "saju_select_all" ON saju_profiles FOR SELECT USING (true);
CREATE POLICY "saju_insert_all" ON saju_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "saju_update_all" ON saju_profiles FOR UPDATE USING (true);

-- 3. saju_history
CREATE TABLE IF NOT EXISTS saju_history (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, type TEXT DEFAULT 'calculation',
    data JSONB, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE saju_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saju_history_select" ON saju_history;
DROP POLICY IF EXISTS "saju_history_insert" ON saju_history;
CREATE POLICY "saju_history_select" ON saju_history FOR SELECT USING (true);
CREATE POLICY "saju_history_insert" ON saju_history FOR INSERT WITH CHECK (true);

-- 4. fortune_records
CREATE TABLE IF NOT EXISTS fortune_records (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, fortune_type TEXT NOT NULL,
    cost INT DEFAULT 0, result TEXT NOT NULL,
    expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE fortune_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fortune_select" ON fortune_records;
DROP POLICY IF EXISTS "fortune_insert" ON fortune_records;
DROP POLICY IF EXISTS "fortune_records_select" ON fortune_records;
DROP POLICY IF EXISTS "fortune_records_insert" ON fortune_records;
CREATE POLICY "fortune_select" ON fortune_records FOR SELECT USING (true);
CREATE POLICY "fortune_insert" ON fortune_records FOR INSERT WITH CHECK (true);

-- 5. artists
CREATE TABLE IF NOT EXISTS artists (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT UNIQUE, display_name TEXT NOT NULL,
    bio TEXT, portfolio_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE, is_approved BOOLEAN DEFAULT FALSE,
    follower_count INT DEFAULT 0, artwork_count INT DEFAULT 0,
    avatar_url TEXT, specialties TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "artists_select" ON artists;
DROP POLICY IF EXISTS "artists_insert" ON artists;
DROP POLICY IF EXISTS "artists_update" ON artists;
DROP POLICY IF EXISTS "artists_select_all" ON artists;
CREATE POLICY "artists_select" ON artists FOR SELECT USING (true);
CREATE POLICY "artists_insert" ON artists FOR INSERT WITH CHECK (true);
CREATE POLICY "artists_update" ON artists FOR UPDATE USING (true);

-- 6. artworks
CREATE TABLE IF NOT EXISTS artworks (
    id BIGSERIAL PRIMARY KEY,
    artist_id BIGINT REFERENCES artists(id),
    artist_name TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL, description TEXT,
    image_urls TEXT[] DEFAULT '{}', thumbnail_url TEXT NOT NULL DEFAULT '',
    price INT DEFAULT 0, rental_price INT,
    genre TEXT DEFAULT '', style_tags TEXT[] DEFAULT '{}',
    color_palette TEXT[] DEFAULT '{}', ohaeng_tags TEXT[] DEFAULT '{}',
    mood_tags TEXT[] DEFAULT '{}', case_code TEXT,
    size_cm_w INT DEFAULT 0, size_cm_h INT DEFAULT 0,
    status TEXT DEFAULT 'available', is_demo BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0, like_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "artworks_select" ON artworks;
DROP POLICY IF EXISTS "artworks_insert" ON artworks;
DROP POLICY IF EXISTS "artworks_update" ON artworks;
DROP POLICY IF EXISTS "artworks_delete" ON artworks;
DROP POLICY IF EXISTS "artworks_select_all" ON artworks;
CREATE POLICY "artworks_select" ON artworks FOR SELECT USING (true);
CREATE POLICY "artworks_insert" ON artworks FOR INSERT WITH CHECK (true);
CREATE POLICY "artworks_update" ON artworks FOR UPDATE USING (true);
CREATE POLICY "artworks_delete" ON artworks FOR DELETE USING (true);

-- 7. orders
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, artwork_id BIGINT REFERENCES artworks(id),
    artwork_title TEXT, artwork_thumbnail_url TEXT,
    type TEXT DEFAULT 'purchase', amount INT DEFAULT 0,
    status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_select" ON orders;
DROP POLICY IF EXISTS "orders_insert" ON orders;
CREATE POLICY "orders_select" ON orders FOR SELECT USING (true);
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (true);

-- 8. user_coins
CREATE TABLE IF NOT EXISTS user_coins (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL, balance INT DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coins_select" ON user_coins;
DROP POLICY IF EXISTS "coins_insert" ON user_coins;
DROP POLICY IF EXISTS "coins_update" ON user_coins;
CREATE POLICY "coins_select" ON user_coins FOR SELECT USING (true);
CREATE POLICY "coins_insert" ON user_coins FOR INSERT WITH CHECK (true);
CREATE POLICY "coins_update" ON user_coins FOR UPDATE USING (true);

-- 9. coin_transactions
CREATE TABLE IF NOT EXISTS coin_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, amount INT NOT NULL,
    type TEXT NOT NULL, description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coin_tx_select" ON coin_transactions;
DROP POLICY IF EXISTS "coin_tx_insert" ON coin_transactions;
CREATE POLICY "coin_tx_select" ON coin_transactions FOR SELECT USING (true);
CREATE POLICY "coin_tx_insert" ON coin_transactions FOR INSERT WITH CHECK (true);

-- 10. fortune_history
CREATE TABLE IF NOT EXISTS fortune_history (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, fortune_type TEXT NOT NULL,
    result TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE fortune_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fortune_hist_select" ON fortune_history;
DROP POLICY IF EXISTS "fortune_hist_insert" ON fortune_history;
CREATE POLICY "fortune_hist_select" ON fortune_history FOR SELECT USING (true);
CREATE POLICY "fortune_hist_insert" ON fortune_history FOR INSERT WITH CHECK (true);

-- 11. chat_sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, messages JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_select" ON chat_sessions;
DROP POLICY IF EXISTS "chat_insert" ON chat_sessions;
DROP POLICY IF EXISTS "chat_update" ON chat_sessions;
CREATE POLICY "chat_select" ON chat_sessions FOR SELECT USING (true);
CREATE POLICY "chat_insert" ON chat_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "chat_update" ON chat_sessions FOR UPDATE USING (true);

-- 12. art_taste_selections
CREATE TABLE IF NOT EXISTS art_taste_selections (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, round INT,
    selections JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE art_taste_selections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "taste_select" ON art_taste_selections;
DROP POLICY IF EXISTS "taste_insert" ON art_taste_selections;
DROP POLICY IF EXISTS "taste_update" ON art_taste_selections;
DROP POLICY IF EXISTS "taste_anon_insert" ON art_taste_selections;
CREATE POLICY "taste_select" ON art_taste_selections FOR SELECT USING (true);
CREATE POLICY "taste_insert" ON art_taste_selections FOR INSERT WITH CHECK (true);
CREATE POLICY "taste_update" ON art_taste_selections FOR UPDATE USING (true);

-- 13. app_settings
CREATE TABLE IF NOT EXISTS app_settings (
    id BIGSERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL, value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_select" ON app_settings;
DROP POLICY IF EXISTS "settings_insert" ON app_settings;
DROP POLICY IF EXISTS "settings_update" ON app_settings;
CREATE POLICY "settings_select" ON app_settings FOR SELECT USING (true);
CREATE POLICY "settings_insert" ON app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "settings_update" ON app_settings FOR UPDATE USING (true);

-- ════════════════════════════════════════════════════════
-- 인덱스
-- ════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles (email);
CREATE INDEX IF NOT EXISTS idx_saju_profiles_user_id ON saju_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_fortune_records_user ON fortune_records (user_id, fortune_type);
CREATE INDEX IF NOT EXISTS idx_artworks_status ON artworks (status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_saju_history_user ON saju_history (user_id);

-- ════════════════════════════════════════════════════════
-- 신규 가입 시 코인 100개 자동 지급
-- ════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION auto_create_coins()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_coins (user_id, balance) VALUES (NEW.user_id, 100)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_profiles_auto_coins ON user_profiles;
CREATE TRIGGER user_profiles_auto_coins
    AFTER INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_coins();
