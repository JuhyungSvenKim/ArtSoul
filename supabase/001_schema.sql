-- ============================================
-- Art+Soul MVP Database Schema
-- ============================================

-- 1. Users (프로필)
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  nickname text not null,
  avatar_url text,
  birth_date date not null,
  birth_time time,
  name_korean text not null,
  name_hanja text,
  gender text not null check (gender in ('male', 'female')),
  mbti text check (mbti in (
    'INTJ','INTP','ENTJ','ENTP',
    'INFJ','INFP','ENFJ','ENFP',
    'ISTJ','ISFJ','ESTJ','ESFJ',
    'ISTP','ISFP','ESTP','ESFP'
  )),
  role text not null default 'consumer' check (role in ('consumer', 'artist', 'both')),
  is_pass_verified boolean not null default false,
  onboarding_step text not null default 'birth' check (onboarding_step in ('birth', 'mbti', 'taste', 'dna_card', 'complete')),
  created_at timestamptz not null default now()
);

-- 2. Artists (작가 프로필)
create table public.artists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  display_name text not null,
  bio text,
  portfolio_url text,
  is_verified boolean not null default false,
  follower_count int not null default 0,
  artwork_count int not null default 0,
  avatar_url text,
  created_at timestamptz not null default now(),
  unique(user_id)
);

-- 3. Saju Profiles (사주 분석 결과)
create table public.saju_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  year_pillar jsonb not null,   -- { cheongan, jiji, ohaeng }
  month_pillar jsonb not null,
  day_pillar jsonb not null,
  hour_pillar jsonb,            -- nullable (시간 모르면)
  ilgan text not null,
  ohaeng_balance jsonb not null, -- { 목: n, 화: n, 토: n, 금: n, 수: n }
  sinsal jsonb not null default '[]',
  daeun jsonb not null default '[]',
  gyeokguk text not null,
  name_analysis jsonb,
  art_dna jsonb not null,       -- { dominantOhaeng, subOhaeng, recommendedStyles, ... }
  art_dna_card_url text,
  full_interpretation text,
  created_at timestamptz not null default now(),
  unique(user_id)
);

-- 4. Artworks (작품)
create table public.artworks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  artist_name text not null,
  title text not null,
  description text,
  image_urls text[] not null default '{}',
  thumbnail_url text not null,
  price int not null,
  rental_price int,
  genre text not null,
  style_tags text[] not null default '{}',
  color_palette text[] not null default '{}',
  ohaeng_tags text[] not null default '{}',
  mood_tags text[] not null default '{}',
  size_cm_w int not null,
  size_cm_h int not null,
  status text not null default 'available' check (status in ('available', 'rented', 'sold', 'hidden')),
  is_demo boolean not null default false,
  view_count int not null default 0,
  like_count int not null default 0,
  created_at timestamptz not null default now()
);

-- 5. Orders (주문/구매)
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  artwork_id uuid not null references public.artworks(id),
  artwork_title text not null,
  artwork_thumbnail_url text not null,
  type text not null check (type in ('purchase', 'rental')),
  amount int not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'shipped', 'delivered', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- 6. Rentals (렌탈)
create table public.rentals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  artwork_id uuid not null references public.artworks(id),
  artwork_title text not null,
  artwork_thumbnail_url text not null,
  cycle_months int not null check (cycle_months in (3, 6)),
  start_date date not null,
  next_exchange_date date not null,
  status text not null default 'active' check (status in ('active', 'exchange_pending', 'returned', 'converted_to_purchase')),
  total_paid int not null default 0,
  created_at timestamptz not null default now()
);

-- 7. Art Taste Selections (취향 테스트 결과)
create table public.art_taste_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  round int not null,
  selected_artwork_id text not null,
  selected_ohaeng_tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- 8. Likes (좋아요)
create table public.likes (
  user_id uuid not null references public.users(id) on delete cascade,
  artwork_id uuid not null references public.artworks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, artwork_id)
);

-- ============================================
-- Indexes
-- ============================================
create index idx_artworks_artist on public.artworks(artist_id);
create index idx_artworks_status on public.artworks(status);
create index idx_artworks_genre on public.artworks(genre);
create index idx_orders_user on public.orders(user_id);
create index idx_rentals_user on public.rentals(user_id);
create index idx_saju_profiles_user on public.saju_profiles(user_id);
create index idx_art_taste_user on public.art_taste_selections(user_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
alter table public.users enable row level security;
alter table public.artists enable row level security;
alter table public.saju_profiles enable row level security;
alter table public.artworks enable row level security;
alter table public.orders enable row level security;
alter table public.rentals enable row level security;
alter table public.art_taste_selections enable row level security;
alter table public.likes enable row level security;

-- 모든 사람이 작품/작가를 볼 수 있음
create policy "artworks_select_all" on public.artworks for select using (true);
create policy "artists_select_all" on public.artists for select using (true);

-- 유저는 자기 데이터만 CRUD
create policy "users_select_own" on public.users for select using (true);
create policy "users_update_own" on public.users for update using (id = auth.uid());
create policy "users_insert_own" on public.users for insert with check (id = auth.uid());

create policy "saju_select_own" on public.saju_profiles for select using (user_id = auth.uid());
create policy "saju_insert_own" on public.saju_profiles for insert with check (user_id = auth.uid());
create policy "saju_update_own" on public.saju_profiles for update using (user_id = auth.uid());

create policy "orders_select_own" on public.orders for select using (user_id = auth.uid());
create policy "orders_insert_own" on public.orders for insert with check (user_id = auth.uid());

create policy "rentals_select_own" on public.rentals for select using (user_id = auth.uid());
create policy "rentals_insert_own" on public.rentals for insert with check (user_id = auth.uid());

create policy "taste_select_own" on public.art_taste_selections for select using (user_id = auth.uid());
create policy "taste_insert_own" on public.art_taste_selections for insert with check (user_id = auth.uid());

create policy "likes_select_own" on public.likes for select using (user_id = auth.uid());
create policy "likes_insert_own" on public.likes for insert with check (user_id = auth.uid());
create policy "likes_delete_own" on public.likes for delete using (user_id = auth.uid());
