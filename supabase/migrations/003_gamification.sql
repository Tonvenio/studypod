-- XP event log (audit trail for all XP awards)
create table if not exists public.xp_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  action text not null, -- 'deck_created', 'card_reviewed', 'combo_bonus', 'crit_hit', 'loot_drop', 'speed_bonus', 'streak_bonus', 'daily_login', 'quest_completed', 'perfect_round', 'mastery_up'
  xp_amount integer not null,
  metadata jsonb default '{}', -- combo_count, crit_multiplier, loot_tier, etc.
  created_at timestamptz default now()
);

alter table public.xp_events enable row level security;
create policy "Users can view own xp events" on public.xp_events for select using (auth.uid() = user_id);
create policy "Users can insert own xp events" on public.xp_events for insert with check (auth.uid() = user_id);

create index idx_xp_events_user_date on public.xp_events(user_id, created_at desc);

-- Badges
create table if not exists public.badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_key text not null, -- 'first_quest', 'sound_check', 'scholar_100', 'streak_7', 'perfectionist_3', 'librarian_10', 'marathon_30', 'upload_master_5', 'combo_king_10', 'crit_collector_50', 'speed_demon'
  earned_at timestamptz default now(),
  unique (user_id, badge_key)
);

alter table public.badges enable row level security;
create policy "Users can view own badges" on public.badges for select using (auth.uid() = user_id);
create policy "Users can insert own badges" on public.badges for insert with check (auth.uid() = user_id);

-- Daily quests (3 per day)
create table if not exists public.daily_quests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  quest_date date not null default current_date,
  quest_type text not null, -- 'review_10', 'create_deck', 'listen_5', 'correct_streak_5', 'review_overdue', 'perfect_round', 'speed_round_3'
  quest_label text not null,
  target integer not null default 1,
  progress integer not null default 0,
  xp_reward integer not null default 20,
  completed boolean not null default false,
  completed_at timestamptz,
  unique (user_id, quest_date, quest_type)
);

alter table public.daily_quests enable row level security;
create policy "Users can manage own quests" on public.daily_quests for all using (auth.uid() = user_id);

-- Daily login rewards (7-day escalating cycle)
create table if not exists public.daily_logins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  login_date date not null default current_date,
  day_in_cycle integer not null default 1, -- 1-7, resets on miss
  xp_awarded integer not null,
  claimed boolean not null default false,
  unique (user_id, login_date)
);

alter table public.daily_logins enable row level security;
create policy "Users can manage own logins" on public.daily_logins for all using (auth.uid() = user_id);

-- Add mastery_tier and review stats to card_progress
alter table public.card_progress
  add column if not exists mastery_tier smallint default 0 check (mastery_tier between 0 and 4),
  -- 0=New, 1=Learning, 2=Familiar, 3=Known, 4=Mastered
  add column if not exists correct_streak integer default 0,
  add column if not exists total_reviews integer default 0,
  add column if not exists total_correct integer default 0;

-- Add gamification stats to profiles
alter table public.profiles
  add column if not exists level integer default 1,
  add column if not exists total_cards_reviewed integer default 0,
  add column if not exists total_correct integer default 0,
  add column if not exists total_decks_created integer default 0,
  add column if not exists best_combo integer default 0,
  add column if not exists total_crits integer default 0,
  add column if not exists login_cycle_day integer default 0,
  add column if not exists last_login_date date,
  add column if not exists streak_shields integer default 0;

-- Level calculation function
create or replace function public.calculate_level(xp integer)
returns integer as $$
declare
  lvl integer := 1;
begin
  if xp <= 0 then return 1; end if;
  -- Start from estimate, then bump up
  lvl := greatest(1, floor(power(xp::numeric / 40.0, 1.0 / 1.85))::integer);
  while public.xp_for_level(lvl + 1) <= xp loop
    lvl := lvl + 1;
  end loop;
  return lvl;
end;
$$ language plpgsql immutable;

-- XP needed for a given level
create or replace function public.xp_for_level(lvl integer)
returns integer as $$
begin
  if lvl <= 1 then return 0; end if;
  return floor(40.0 * power(lvl::numeric, 1.85))::integer;
end;
$$ language plpgsql immutable;
