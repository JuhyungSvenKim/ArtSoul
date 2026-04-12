-- ════════════════════════════════════════════════════════
-- artists 테이블 재정의 — user_profiles.user_id(TEXT)와 연결
-- Supabase SQL Editor에서 실행
-- ════════════════════════════════════════════════════════

-- 기존 artists 테이블 삭제 (FK 충돌 방지)
-- 주의: 기존 데이터가 있으면 백업 후 실행
DROP TABLE IF EXISTS artists CASCADE;

CREATE TABLE artists (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,          -- user_profiles.user_id와 동일

    -- 작가 기본 정보
    artist_name TEXT NOT NULL,              -- 활동명
    bio TEXT,                               -- 작가 소개
    portfolio_url TEXT,                     -- 포트폴리오 링크
    business_number TEXT,                   -- 사업자 번호 (선택)
    avatar_url TEXT,

    -- 심사 상태
    status TEXT NOT NULL DEFAULT 'pending'  -- pending(심사중), approved(승인), rejected(거절)
        CHECK (status IN ('pending', 'approved', 'rejected')),
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    rejected_reason TEXT,

    -- 통계
    artwork_count INT NOT NULL DEFAULT 0,
    total_sales INT NOT NULL DEFAULT 0,
    follower_count INT NOT NULL DEFAULT 0,

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artists_user_id ON artists (user_id);
CREATE INDEX idx_artists_status ON artists (status);

-- RLS
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artists_select_all" ON artists FOR SELECT USING (true);
CREATE POLICY "artists_insert" ON artists FOR INSERT WITH CHECK (true);
CREATE POLICY "artists_update" ON artists FOR UPDATE USING (true);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_artists_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS artists_updated_at ON artists;
CREATE TRIGGER artists_updated_at
    BEFORE UPDATE ON artists
    FOR EACH ROW EXECUTE FUNCTION update_artists_updated_at();
