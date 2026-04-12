-- chat_sessions 재정의 — 상담 대화 기록 + 요약
DROP TABLE IF EXISTS chat_sessions CASCADE;

CREATE TABLE chat_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    messages JSONB NOT NULL DEFAULT '[]',
    summary TEXT,
    message_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user ON chat_sessions (user_id);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_select" ON chat_sessions FOR SELECT USING (true);
CREATE POLICY "chat_insert" ON chat_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "chat_update" ON chat_sessions FOR UPDATE USING (true);
