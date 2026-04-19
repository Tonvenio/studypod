-- Add feed_token for per-user podcast feeds
alter table public.profiles
  add column if not exists feed_token uuid default gen_random_uuid() unique;

-- Add audio storage path to flashcards
alter table public.flashcards
  add column if not exists audio_storage_path text;

-- Index for fast feed lookups
create index if not exists idx_profiles_feed_token on public.profiles(feed_token);

-- Allow public read of feed_token for podcast feed route (no auth needed, token is unguessable)
create policy "Feed token lookup" on public.profiles for select using (true);
