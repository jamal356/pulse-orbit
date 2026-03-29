-- Pulse Waitlist — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- 1. Create the waitlist table
create table public.waitlist (
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

-- 2. Enable Row Level Security (required by Supabase)
alter table public.waitlist enable row level security;

-- 3. Policy: allow anonymous inserts (for the waitlist form)
create policy "Allow anonymous inserts"
  on public.waitlist
  for insert
  to anon
  with check (true);

-- 4. Policy: allow anonymous to read their own row (for position number)
create policy "Allow anonymous select"
  on public.waitlist
  for select
  to anon
  using (true);

-- 5. Create the storage bucket for photos
insert into storage.buckets (id, name, public)
values ('waitlist-photos', 'waitlist-photos', true);

-- 6. Policy: allow anonymous uploads to the photos bucket
create policy "Allow anonymous uploads"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'waitlist-photos');

-- 7. Policy: allow public reads on photos
create policy "Allow public photo reads"
  on storage.objects
  for select
  to anon
  using (bucket_id = 'waitlist-photos');
