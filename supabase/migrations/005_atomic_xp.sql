-- Atomic XP increment to prevent race conditions
create or replace function public.increment_xp(
  p_user_id uuid,
  p_xp_amount integer,
  p_was_correct boolean default false,
  p_is_crit boolean default false,
  p_combo integer default 0,
  p_streak integer default null,
  p_longest_streak integer default null,
  p_study_date date default null
)
returns table(new_xp integer, new_level integer) as $$
declare
  v_new_xp integer;
  v_new_level integer;
begin
  update public.profiles set
    xp_points = xp_points + p_xp_amount,
    level = public.calculate_level(xp_points + p_xp_amount),
    total_cards_reviewed = total_cards_reviewed + 1,
    total_correct = total_correct + (case when p_was_correct then 1 else 0 end),
    total_crits = total_crits + (case when p_is_crit then 1 else 0 end),
    best_combo = greatest(best_combo, p_combo),
    current_streak = coalesce(p_streak, current_streak),
    longest_streak = greatest(longest_streak, coalesce(p_longest_streak, longest_streak)),
    last_study_date = coalesce(p_study_date, last_study_date)
  where id = p_user_id
  returning xp_points, level into v_new_xp, v_new_level;

  return query select v_new_xp, v_new_level;
end;
$$ language plpgsql security definer;
