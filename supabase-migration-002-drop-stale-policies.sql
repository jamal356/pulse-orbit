-- ============================================================================
-- Migration 002: drop stale recursive policies that survived 001.
--
-- Background: the production DB had a SECOND set of policies with shorter
-- names (sp_read, rounds_read) created by a prior migration that wasn't
-- in this repo's schema file. They contain the same recursive subquery
-- pattern as the original policies migration 001 fixed. Multiple
-- PERMISSIVE policies are OR'd by Postgres, so any one bad policy
-- re-triggers itself before the safe path can short-circuit and the
-- whole table returns 42P17 (infinite recursion).
--
-- Migration 001's `drop policy if exists` only handled the names from
-- this repo's schema. This migration sweeps the duplicates.
--
-- After this migration: session_participants + rounds return 200 for both
-- service_role and anon callers, with the SECURITY DEFINER helper from
-- 001 doing the actual access check.
-- ============================================================================

drop policy if exists "sp_read"     on public.session_participants;
drop policy if exists "rounds_read" on public.rounds;

-- Note for follow-up: sp_create / sp_update / rounds_create / rounds_update
-- also exist as duplicates of the service-role-only policies in the schema,
-- and at least sp_update + rounds_update use `using (true)` which is
-- broader than intended. Not dropping here because writes go through the
-- service-role API routes anyway and changing INSERT/UPDATE access mid-
-- session is risky. Worth a separate security pass.

do $$
declare sp_count int; r_count int;
begin
  select count(*) into sp_count from public.session_participants;
  select count(*) into r_count  from public.rounds;
  raise notice 'session_participants rows: %', sp_count;
  raise notice 'rounds rows: %', r_count;
end $$;
