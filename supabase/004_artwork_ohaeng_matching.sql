-- ============================================
-- Artwork schema extension for saju-art matching
-- Run in Supabase SQL Editor
-- ============================================

-- 기존 artworks 테이블에 오행 매칭 필드 추가
ALTER TABLE public.artworks
  ADD COLUMN IF NOT EXISTS ohaeng_scores jsonb NOT NULL DEFAULT '{"목":0,"화":0,"토":0,"금":0,"수":0}',
  ADD COLUMN IF NOT EXISTS primary_ohaeng text,
  ADD COLUMN IF NOT EXISTS secondary_ohaeng text,
  ADD COLUMN IF NOT EXISTS eum_yang text CHECK (eum_yang IN ('양', '음', '중성')),
  ADD COLUMN IF NOT EXISTS energy_level text CHECK (energy_level IN ('강', '중', '약')),
  ADD COLUMN IF NOT EXISTS recommended_direction text,
  ADD COLUMN IF NOT EXISTS recommended_space text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS related_sinsal text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS symbolic_animals text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recommended_effects text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_description text,
  ADD COLUMN IF NOT EXISTS artist_birth_date date,
  ADD COLUMN IF NOT EXISTS artist_ilgan text,
  ADD COLUMN IF NOT EXISTS artist_ohaeng_scores jsonb,
  ADD COLUMN IF NOT EXISTS is_admin_uploaded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS image_url text;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_artworks_primary_ohaeng ON public.artworks(primary_ohaeng);
CREATE INDEX IF NOT EXISTS idx_artworks_admin ON public.artworks(is_admin_uploaded);

-- 어드민 역할 (users 테이블)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- 어드민 insert/update 정책
CREATE POLICY "artworks_anon_insert" ON public.artworks FOR INSERT WITH CHECK (true);
CREATE POLICY "artworks_anon_update" ON public.artworks FOR UPDATE USING (true);
CREATE POLICY "artworks_anon_delete" ON public.artworks FOR DELETE USING (true);
