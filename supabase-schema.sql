-- Pulse Platform — Complete Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- ============================================================================
-- 1. WAITLIST TABLE (preserve existing)
-- ============================================================================

create table if not exists public.waitlist (
  id          bigint generated always as identity primary key,
  position    bigint generated always as identity,
  email       text,
  first_name  text,
  age         text,
  gender      text,
  looking_for text,
  city        text,
  attraction  text,
  friday_night text,
  dealbreaker text,
  photo_url   text,
  created_at  timestamptz default now()
);

alter table public.waitlist enable row level security;

create policy if not exists "Allow anonymous inserts"
  on public.waitlist
  for insert
  to anon
  with check (true);

create policy if not exists "Allow anonymous select"
  on public.waitlist
  for select
  to anon
  using (true);

-- ============================================================================
-- 2. USERS TABLE (extends auth.users)
-- ============================================================================

create table if not exists public.users (
  id            uuid primary key references auth.users on delete cascade,
  email         text unique,
  phone         text unique,
  display_name  text not null,
  age           int not null check (age >= 18),
  gender        text not null,
  city          text,
  bio           text check (length(bio) <= 300),
  photo_url     text,
  interests     text[],
  is_verified   boolean default false,
  is_banned     boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  last_seen     timestamptz
);

alter table public.users enable row level security;

create policy if not exists "users_read_all"
  on public.users
  for select
  using (true);

create policy if not exists "users_update_own"
  on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_is_banned on public.users(is_banned);
create index if not exists idx_users_created_at on public.users(created_at);

-- ============================================================================
-- 3. SESSIONS TABLE
-- ============================================================================

create table if not exists public.sessions (
  id                uuid primary key default gen_random_uuid(),
  type              text not null check (type in ('on_demand', 'scheduled')),
  status            text not null default 'waiting'
                    check (status in ('waiting', 'countdown', 'live', 'rating', 'completed', 'cancelled')),
  scheduled_at      timestamptz,
  started_at        timestamptz,
  ended_at          timestamptz,
  max_participants  int default 5,
  current_round     int default 0,
  total_rounds      int,
  created_at        timestamptz default now()
);

alter table public.sessions enable row level security;

create policy if not exists "sessions_read_authenticated"
  on public.sessions
  for select
  using (auth.role() = 'authenticated' or auth.role() = 'service_role');

create policy if not exists "sessions_create_service_role"
  on public.sessions
  for insert
  to service_role
  with check (true);

create policy if not exists "sessions_update_service_role"
  on public.sessions
  for update
  to service_role
  using (true)
  with check (true);

create index if not exists idx_sessions_status on public.sessions(status);
create index if not exists idx_sessions_type on public.sessions(type);
create index if not exists idx_sessions_created_at on public.sessions(created_at);

-- ============================================================================
-- 4. SESSION_PARTICIPANTS TABLE
-- ============================================================================

create table if not exists public.session_participants (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions on delete cascade,
  user_id     uuid not null references public.users on delete cascade,
  joined_at   timestamptz default now(),
  left_at     timestamptz,
  status      text default 'active'
              check (status in ('active', 'disconnected', 'left', 'removed')),
  unique(session_id, user_id)
);

alter table public.session_participants enable row level security;

create policy if not exists "session_participants_read_participants"
  on public.session_participants
  for select
  using (
    auth.uid() in (
      select user_id from public.session_participants
      where session_id = (
        select session_id from public.session_participants where id = session_participants.id
      )
    ) or auth.role() = 'service_role'
  );

create policy if not exists "session_participants_create_service_role"
  on public.session_participants
  for insert
  to service_role
  with check (true);

create policy if not exists "session_participants_update_service_role"
  on public.session_participants
  for update
  to service_role
  using (true)
  with check (true);

create index if not exists idx_session_participants_session_id on public.session_participants(session_id);
create index if not exists idx_session_participants_user_id on public.session_participants(user_id);
create index if not exists idx_session_participants_status on public.session_participants(status);

-- ============================================================================
-- 5. ROUNDS TABLE
-- ============================================================================

create table if not exists public.rounds (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions on delete cascade,
  round_number  int not null,
  user_a        uuid not null references public.users on delete cascade,
  user_b        uuid not null references public.users on delete cascade,
  started_at    timestamptz,
  ended_at      timestamptz,
  extended      boolean default false,
  spark_a       boolean default false,
  spark_b       boolean default false,
  mutual_spark  boolean generated always as (spark_a and spark_b) stored
);

alter table public.rounds enable row level security;

create policy if not exists "rounds_read_participants"
  on public.rounds
  for select
  using (
    auth.uid() in (
      select user_id from public.session_participants
      where session_id = rounds.session_id
    ) or auth.role() = 'service_role'
  );

create policy if not exists "rounds_create_service_role"
  on public.rounds
  for insert
  to service_role
  with check (true);

create policy if not exists "rounds_update_service_role"
  on public.rounds
  for update
  to service_role
  using (true)
  with check (true);

create index if not exists idx_rounds_session_id on public.rounds(session_id);
create index if not exists idx_rounds_user_a on public.rounds(user_a);
create index if not exists idx_rounds_user_b on public.rounds(user_b);

-- ============================================================================
-- 6. RATINGS TABLE
-- ============================================================================

create table if not exists public.ratings (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions on delete cascade,
  round_id    uuid not null references public.rounds on delete cascade,
  rater_id    uuid not null references public.users on delete cascade,
  rated_id    uuid not null references public.users on delete cascade,
  rating      text not null check (rating in ('like', 'pass')),
  created_at  timestamptz default now(),
  unique(round_id, rater_id)
);

alter table public.ratings enable row level security;

create policy if not exists "ratings_insert_own"
  on public.ratings
  for insert
  using (auth.uid() = rater_id);

create policy if not exists "ratings_read_own"
  on public.ratings
  for select
  using (auth.uid() = rater_id or auth.role() = 'service_role');

create index if not exists idx_ratings_session_id on public.ratings(session_id);
create index if not exists idx_ratings_round_id on public.ratings(round_id);
create index if not exists idx_ratings_rater_id on public.ratings(rater_id);

-- ============================================================================
-- 7. MATCHES TABLE
-- ============================================================================

create table if not exists public.matches (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions on delete cascade,
  user_a      uuid not null references public.users on delete cascade,
  user_b      uuid not null references public.users on delete cascade,
  matched_at  timestamptz default now(),
  status      text default 'active'
              check (status in ('active', 'blocked', 'expired'))
);

alter table public.matches enable row level security;

create policy if not exists "matches_read_own"
  on public.matches
  for select
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy if not exists "matches_create_service_role"
  on public.matches
  for insert
  to service_role
  with check (true);

create policy if not exists "matches_update_own"
  on public.matches
  for update
  using (auth.uid() = user_a or auth.uid() = user_b);

create index if not exists idx_matches_session_id on public.matches(session_id);
create index if not exists idx_matches_user_a on public.matches(user_a);
create index if not exists idx_matches_user_b on public.matches(user_b);
create index if not exists idx_matches_status on public.matches(status);

-- ============================================================================
-- 8. REPORTS TABLE
-- ============================================================================

create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references public.users on delete cascade,
  reported_id   uuid not null references public.users on delete cascade,
  session_id    uuid references public.sessions on delete set null,
  reason        text not null
                check (reason in ('inappropriate', 'harassment', 'fake_profile', 'underage', 'spam', 'other')),
  details       text,
  status        text default 'pending'
                check (status in ('pending', 'reviewed', 'action_taken', 'dismissed')),
  created_at    timestamptz default now()
);

alter table public.reports enable row level security;

create policy if not exists "reports_insert_own"
  on public.reports
  for insert
  using (auth.uid() = reporter_id);

create policy if not exists "reports_read_service_role"
  on public.reports
  for select
  to service_role
  using (true);

create index if not exists idx_reports_reporter_id on public.reports(reporter_id);
create index if not exists idx_reports_reported_id on public.reports(reported_id);
create index if not exists idx_reports_session_id on public.reports(session_id);
create index if not exists idx_reports_status on public.reports(status);

-- ============================================================================
-- 9. BLOCKS TABLE
-- ============================================================================

create table if not exists public.blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references public.users on delete cascade,
  blocked_id  uuid not null references public.users on delete cascade,
  created_at  timestamptz default now(),
  unique(blocker_id, blocked_id)
);

alter table public.blocks enable row level security;

create policy if not exists "blocks_read_own"
  on public.blocks
  for select
  using (auth.uid() = blocker_id or auth.uid() = blocked_id);

create policy if not exists "blocks_insert_own"
  on public.blocks
  for insert
  using (auth.uid() = blocker_id);

create policy if not exists "blocks_delete_own"
  on public.blocks
  for delete
  using (auth.uid() = blocker_id);

create index if not exists idx_blocks_blocker_id on public.blocks(blocker_id);
create index if not exists idx_blocks_blocked_id on public.blocks(blocked_id);

-- ============================================================================
-- 10. STORAGE BUCKET FOR PHOTOS
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('waitlist-photos', 'waitlist-photos', true)
on conflict do nothing;

create policy if not exists "Allow anonymous uploads"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'waitlist-photos');

create policy if not exists "Allow public photo reads"
  on storage.objects
  for select
  to anon
  using (bucket_id = 'waitlist-photos');
