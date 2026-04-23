-- Subscription tracking
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  lemon_customer_id text,
  lemon_subscription_id text unique,
  plan text not null default 'free' check (plan in ('free', 'pro', 'exam_boost')),
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired', 'past_due', 'paused')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;
create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);

create index idx_subscriptions_user on public.subscriptions(user_id);
create index idx_subscriptions_lemon on public.subscriptions(lemon_subscription_id);

-- Usage tracking per billing period
create table if not exists public.usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  period_start date not null,
  decks_created integer default 0,
  audio_cards_rendered integer default 0,
  documents_uploaded integer default 0,
  unique (user_id, period_start)
);

alter table public.usage enable row level security;
create policy "Users can view own usage" on public.usage for select using (auth.uid() = user_id);
create policy "Users can update own usage" on public.usage for all using (auth.uid() = user_id);

-- Add referral_code to profiles
alter table public.profiles
  add column if not exists referral_code text unique default substr(md5(random()::text), 1, 8),
  add column if not exists referred_by uuid references public.profiles(id);
