-- 사주 분석 기록 테이블
CREATE TABLE IF NOT EXISTS saju_history (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    input_data JSONB NOT NULL,        -- { year, month, day, hour, gender, calendarType }
    solar_date JSONB NOT NULL,        -- { year, month, day }
    yeonju JSONB NOT NULL,            -- Ganji 객체
    wolju JSONB NOT NULL,
    ilju JSONB NOT NULL,
    siju JSONB NOT NULL,
    sipsung JSONB NOT NULL,           -- SipsungResult
    daeun JSONB NOT NULL,             -- DaeunItem[]
    daeun_start_age FLOAT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 유저별 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_saju_history_user_id ON saju_history (user_id);

-- 최근 기록 조회용
CREATE INDEX IF NOT EXISTS idx_saju_history_created_at ON saju_history (created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE saju_history ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자가 자기 기록만 조회/생성 가능
CREATE POLICY "Users can read own saju_history"
    ON saju_history FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own saju_history"
    ON saju_history FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);
