-- ============================================================================
-- Migration 001: unblock real sessions in production
--
-- Fixes three hard blockers that make the app unusable end-to-end today:
--
--   A.  Missing INSERT policy on public.users — authenticated signup flow
--       cannot create the user's profile row (ProfileSetup.tsx hangs with
--       a silent RLS denial).
--
--   B.  Missing 'profile-photos' Storage bucket + INSERT policy on
--       storage.objects — photo upload in ProfileSetup.tsx fails.
--
--   C.  Infinite-recursion bug in session_participants + rounds SELECT
--       policies (PostgreSQL error 42P17). Every query against either
--       table from a non-service-role caller returns HTTP 500, so the
--       whole LiveSession flow is dead for real users.
--
-- This migration is idempotent — safe to rerun.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- A. users: allow authenticated users to insert their own profile row.
-- ----------------------------------------------------------------------------

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own"
  on public.users
  for insert
  with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- B. Storage bucket for profile photos + upload policy.
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

drop policy if exists "profile_photos_upload" on storage.objects;
create policy "profile_photos_upload"
  on storage.objects
  for insert
  with check (
    bucket_id = 'profile-photos'
    and auth.role() = 'authenticated'
  );

-- Let authenticated users update / delete their own uploads. Public read
-- already works because the bucket is public=true.
drop policy if exists "profile_photos_update_own" on storage.objects;
create policy "profile_photos_update_own"
  on storage.objects
  for update
  using (bucket_id = 'profile-photos' and auth.uid() = owner);

drop policy if exists "profile_photos_delete_own" on storage.objects;
create policy "profile_photos_delete_own"
  on storage.objects
  for delete
  using (bucket_id = 'profile-photos' and auth.uid() = owner);

-- ----------------------------------------------------------------------------
-- C. RLS recursion fix — SECURITY DEFINER helper + rewritten policies.
--
-- Root cause: the original session_participants SELECT policy subqueried
-- public.session_participants to find "other members of the same
-- session". That inner SELECT re-triggers the outer policy check, and
-- Postgres does not break the cycle (42P17).
--
-- Fix: a SECURITY DEFINER helper function runs with the definer's
-- privileges, bypassing RLS for the internal lookup. No recursion.
-- ----------------------------------------------------------------------------

create or replace function public.user_is_in_session(sid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.session_participants
    where session_id = sid
      and user_id = auth.uid()
  );
$$;

revoke all on function public.user_is_in_session(uuid) from public;
grant execute on function public.user_is_in_session(uuid)
  to anon, authenticated, service_role;

drop policy if exists "session_participants_read_participants"
  on public.session_participants;
create policy "session_participants_read_participants"
  on public.session_participants
  for select
  using (
    user_id = auth.uid()                      -- always see your own row
    or public.user_is_in_session(session_id)  -- or rows of sessions you're in
    or auth.role() = 'service_role'
  );

drop policy if exists "rounds_read_participants" on public.rounds;
create policy "rounds_read_participants"
  on public.rounds
  for select
  using (
    public.user_is_in_session(session_id)
    or auth.role() = 'service_role'
  );

-- ----------------------------------------------------------------------------
-- Sanity check: any remaining recursion surfaces here.
-- ----------------------------------------------------------------------------
do $$
declare sp_count int; r_count int; bucket_exists int;
begin
  select count(*) into sp_count from public.session_participants;
  select count(*) into r_count from public.rounds;
  select count(*) into bucket_exists
    from storage.buckets where id = 'profile-photos';

  raise notice 'session_participants rows: %', sp_count;
  raise notice 'rounds rows: %', r_count;
  raise notice 'profile-photos bucket exists: %',
    case when bucket_exists > 0 then 'yes' else 'NO' end;
end $$;
