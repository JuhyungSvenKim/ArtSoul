-- ============================================
-- Temporary: Allow anonymous inserts/updates for onboarding
-- (Remove after implementing auth)
-- ============================================

-- Users: allow anonymous insert and update
create policy "users_anon_insert" on public.users for insert with check (true);
create policy "users_anon_update" on public.users for update using (true);

-- Art taste selections: allow anonymous insert
create policy "taste_anon_insert" on public.art_taste_selections for insert with check (true);
