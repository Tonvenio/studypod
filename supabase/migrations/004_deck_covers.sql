-- Add cover image URL to decks
alter table public.decks
  add column if not exists cover_image_url text;

-- Storage bucket for cover images
-- (created via config.toml, this is a fallback)
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;
