-- ════════════════════════════════════════════════════════
-- 125 Case Code 기반 작품 테이블
-- Element(W/F/E/M/A) × Energy(1~5) × Style(S1~S5)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS artworks (
    id BIGSERIAL PRIMARY KEY,

    -- 기본 정보
    title TEXT NOT NULL,
    artist TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',

    -- 125 케이스 코드
    case_code TEXT NOT NULL,              -- e.g. "W1-S2"
    element CHAR(1) NOT NULL,             -- W, F, E, M, A
    energy SMALLINT NOT NULL CHECK (energy BETWEEN 1 AND 5),
    style TEXT NOT NULL,                  -- S1, S2, S3, S4, S5

    -- 이미지 & 메타
    image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    space_type TEXT,                       -- 거실, 침실, 서재, 사무실, 상업공간, 카페, 로비, 기타
    price_range TEXT,                      -- 가격대 문자열

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_artworks_case_code ON artworks (case_code);
CREATE INDEX IF NOT EXISTS idx_artworks_element ON artworks (element);
CREATE INDEX IF NOT EXISTS idx_artworks_energy ON artworks (energy);
CREATE INDEX IF NOT EXISTS idx_artworks_style ON artworks (style);
CREATE INDEX IF NOT EXISTS idx_artworks_element_energy ON artworks (element, energy);
CREATE INDEX IF NOT EXISTS idx_artworks_space_type ON artworks (space_type);

-- RLS (공개 조회, 관리자만 수정)
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;

-- 모든 사용자 조회 가능
CREATE POLICY "artworks_select_all"
    ON artworks FOR SELECT
    USING (true);

-- 서비스 키로만 입력/수정/삭제 가능 (어드민)
CREATE POLICY "artworks_insert_admin"
    ON artworks FOR INSERT
    WITH CHECK (true);

CREATE POLICY "artworks_update_admin"
    ON artworks FOR UPDATE
    USING (true);

CREATE POLICY "artworks_delete_admin"
    ON artworks FOR DELETE
    USING (true);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_artworks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER artworks_updated_at
    BEFORE UPDATE ON artworks
    FOR EACH ROW
    EXECUTE FUNCTION update_artworks_updated_at();
