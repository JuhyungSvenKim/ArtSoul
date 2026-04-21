-- ════════════════════════════════════════════════════════
-- ART.D.N.A. 스키마 패치 — 코드에서 사용하는 컬럼 추가
-- Supabase SQL Editor에서 실행
-- ════════════════════════════════════════════════════════

-- 1. artworks — 오행/사주 메타데이터 컬럼 추가
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS primary_ohaeng TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS secondary_ohaeng TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS ohaeng_scores JSONB;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS eum_yang TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS energy_level INT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS recommended_space TEXT[] DEFAULT '{}';
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS related_sinsal TEXT[] DEFAULT '{}';
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS recommended_effects TEXT[] DEFAULT '{}';
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS is_admin_uploaded BOOLEAN DEFAULT FALSE;

-- 2. artists — 상태 관리 컬럼 추가
ALTER TABLE artists ADD COLUMN IF NOT EXISTS artist_name TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS business_number TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE artists ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 3. saju_history — 서비스 기록 컬럼 추가
ALTER TABLE saju_history ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE saju_history ADD COLUMN IF NOT EXISTS cost INT DEFAULT 0;
ALTER TABLE saju_history ADD COLUMN IF NOT EXISTS result TEXT;
ALTER TABLE saju_history ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 4. fortune_history — 비용/프롬프트 컬럼 추가
ALTER TABLE fortune_history ADD COLUMN IF NOT EXISTS cost INT DEFAULT 0;
ALTER TABLE fortune_history ADD COLUMN IF NOT EXISTS saju_prompt TEXT;

-- 5. chat_sessions — 요약/카운트 컬럼 추가
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS message_count INT DEFAULT 0;

-- 6. art_taste_selections — 태그/타임스탬프 추가
ALTER TABLE art_taste_selections ADD COLUMN IF NOT EXISTS top_tags TEXT[] DEFAULT '{}';
ALTER TABLE art_taste_selections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 7. user_profiles — onboarding 컬럼 추가 (혹시 없으면)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name_korean TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name_hanja TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS taste_selections JSONB;
