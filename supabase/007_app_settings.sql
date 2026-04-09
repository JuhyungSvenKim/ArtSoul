-- app_settings 테이블 — 프롬프트를 외부에서 수정 가능
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 사주 해석 시스템 프롬프트
INSERT INTO app_settings (key, value, description) VALUES (
  'saju_system_prompt',
  '여기에 사주 해석 프롬프트를 넣으세요',
  '사주 해석 AI 시스템 프롬프트 (api/gemini.js에서 사용)'
) ON CONFLICT (key) DO NOTHING;

-- 운세 프롬프트들
INSERT INTO app_settings (key, value, description) VALUES
  ('fortune_today_prompt', '', '오늘의 운세 프롬프트'),
  ('fortune_week_prompt', '', '금주의 운세 프롬프트'),
  ('fortune_month_prompt', '', '월간 운세 프롬프트'),
  ('fortune_year_prompt', '', '올해 운세 프롬프트')
ON CONFLICT (key) DO NOTHING;

-- RLS: 누구나 읽기 가능, 수정은 인증된 사용자만
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings_read" ON app_settings FOR SELECT USING (true);
