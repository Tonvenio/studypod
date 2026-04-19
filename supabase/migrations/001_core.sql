-- User profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  xp_points integer default 0,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_study_date date,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Decks
create table if not exists public.decks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  topic text not null,
  description text,
  language text default 'en',
  card_count integer default 0,
  is_public boolean default true,
  status text default 'generating' check (status in ('generating', 'ready', 'failed')),
  created_at timestamptz default now()
);

alter table public.decks enable row level security;
create policy "Public decks viewable by all" on public.decks for select using (is_public = true or auth.uid() = user_id);
create policy "Anyone can create decks" on public.decks for insert with check (true);
create policy "Users can update own decks" on public.decks for update using (auth.uid() = user_id);
create policy "Users can delete own decks" on public.decks for delete using (auth.uid() = user_id);

-- Flashcards
create table if not exists public.flashcards (
  id uuid default gen_random_uuid() primary key,
  deck_id uuid references public.decks(id) on delete cascade not null,
  front text not null,
  back text not null,
  explanation text,
  audio_url text,
  difficulty smallint default 3 check (difficulty between 1 and 5),
  order_index integer default 0,
  created_at timestamptz default now()
);

alter table public.flashcards enable row level security;
create policy "Flashcards visible if deck visible" on public.flashcards for select using (
  exists (select 1 from public.decks where decks.id = flashcards.deck_id and (decks.is_public or decks.user_id = auth.uid()))
);
create policy "Users can manage own flashcards" on public.flashcards for all using (
  exists (select 1 from public.decks where decks.id = flashcards.deck_id and decks.user_id = auth.uid())
);

-- Study sessions
create table if not exists public.study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  deck_id uuid references public.decks(id) on delete cascade not null,
  cards_studied integer default 0,
  correct_count integer default 0,
  duration_seconds integer default 0,
  created_at timestamptz default now()
);

alter table public.study_sessions enable row level security;
create policy "Users can view own sessions" on public.study_sessions for select using (auth.uid() = user_id);
create policy "Users can create sessions" on public.study_sessions for insert with check (auth.uid() = user_id);

-- Card progress (SM-2 spaced repetition)
create table if not exists public.card_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  flashcard_id uuid references public.flashcards(id) on delete cascade not null,
  ease_factor numeric(4,2) default 2.50,
  interval_days integer default 0,
  repetitions integer default 0,
  next_review_at timestamptz default now(),
  last_reviewed_at timestamptz,
  unique (user_id, flashcard_id)
);

alter table public.card_progress enable row level security;
create policy "Users can manage own progress" on public.card_progress for all using (auth.uid() = user_id);

-- Streak update function
create or replace function public.update_study_streak(p_user_id uuid)
returns void as $$
declare
  v_last_date date;
  v_today date := current_date;
  v_current integer;
  v_longest integer;
begin
  select last_study_date, current_streak, longest_streak
  into v_last_date, v_current, v_longest
  from public.profiles where id = p_user_id;

  if v_last_date = v_today then return;
  elsif v_last_date = v_today - 1 then v_current := v_current + 1;
  else v_current := 1;
  end if;

  if v_current > v_longest then v_longest := v_current; end if;

  update public.profiles
  set current_streak = v_current, longest_streak = v_longest,
      last_study_date = v_today, xp_points = xp_points + 10 + (v_current * 2)
  where id = p_user_id;
end;
$$ language plpgsql security definer;
