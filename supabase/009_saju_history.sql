-- ════════════════════════════════════════════════════════
-- saju_history: 유료 사주 서비스 이용 기록
-- 코인을 쓴 모든 사주 관련 활동을 기록
-- ════════════════════════════════════════════════════════

-- 기존 테이블이 있으면 재정의
DROP TABLE IF EXISTS saju_history;

CREATE TABLE saju_history (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,

    -- 서비스 종류
    service_type TEXT NOT NULL CHECK (service_type IN (
      'ai_interpretation',   -- AI 사주 해석
      'fortune_today',       -- 오늘의 운세
      'fortune_week',        -- 금주의 운세
      'fortune_month',       -- 월간 운세
      'fortune_year'         -- 올해 운세
    )),

    -- 비용
    cost INT NOT NULL DEFAULT 0,

    -- 결과 내용
    result TEXT NOT NULL,

    -- 만료 시간 (운세용 — AI해석은 null)
    expires_at TIMESTAMPTZ,

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saju_history_user ON saju_history (user_id, service_type);
CREATE INDEX idx_saju_history_created ON saju_history (user_id, created_at DESC);

-- RLS
ALTER TABLE saju_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saju_history_select" ON saju_history FOR SELECT USING (true);
CREATE POLICY "saju_history_insert" ON saju_history FOR INSERT WITH CHECK (true);
