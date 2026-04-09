-- ============================================
-- Add coins to users + fortune history table
-- Run in Supabase SQL Editor
-- ============================================

-- 1. users 테이블에 coins 컬럼 추가 (기본 10코인)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS coins int NOT NULL DEFAULT 10;

-- 2. 운세 기록 테이블
CREATE TABLE IF NOT EXISTS public.fortune_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  fortune_type text NOT NULL CHECK (fortune_type IN ('today', 'week', 'month', 'year')),
  cost int NOT NULL,
  saju_prompt text NOT NULL,
  result text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fortune_user ON public.fortune_history(user_id);

-- 3. RLS
ALTER TABLE public.fortune_history ENABLE ROW LEVEL SECURITY;

-- 임시 anonymous access (auth 구현 전)
CREATE POLICY "fortune_anon_select" ON public.fortune_history FOR SELECT USING (true);
CREATE POLICY "fortune_anon_insert" ON public.fortune_history FOR INSERT WITH CHECK (true);

-- users update 허용 (coins 차감용)
-- 이미 있으면 무시
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_anon_update' AND tablename = 'users') THEN
    CREATE POLICY "users_anon_update" ON public.users FOR UPDATE USING (true);
  END IF;
END $$;
