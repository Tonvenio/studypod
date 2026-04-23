import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loginRewardForDay, calculateLevel } from '@/lib/gamification/xp-engine';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const today = new Date().toISOString().slice(0, 10);

    // Check if already claimed today
    const { data: existing } = await supabase
      .from('daily_logins')
      .select('*')
      .eq('user_id', user.id)
      .eq('login_date', today)
      .single();

    if (existing?.claimed) {
      return NextResponse.json({ alreadyClaimed: true, dayInCycle: existing.day_in_cycle });
    }

    // Get profile for cycle tracking
    const { data: profile } = await supabase
      .from('profiles')
      .select('last_login_date, login_cycle_day, xp_points')
      .eq('id', user.id)
      .single();

    // Calculate day in cycle
    let dayInCycle = 1;
    if (profile?.last_login_date) {
      const lastLogin = new Date(profile.last_login_date);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive: advance cycle
        dayInCycle = Math.min((profile.login_cycle_day || 0) + 1, 7);
      } else if (diffDays === 0) {
        dayInCycle = profile.login_cycle_day || 1;
      } else {
        // Missed: reset cycle
        dayInCycle = 1;
      }
    }

    const reward = loginRewardForDay(dayInCycle);

    // Insert login record
    await supabase.from('daily_logins').upsert({
      user_id: user.id,
      login_date: today,
      day_in_cycle: dayInCycle,
      xp_awarded: reward.xp,
      claimed: true,
    });

    // Award XP
    await supabase.from('xp_events').insert({
      user_id: user.id,
      action: 'daily_login',
      xp_amount: reward.xp,
      metadata: { dayInCycle, isJackpot: reward.isJackpot },
    });

    const newXp = (profile?.xp_points || 0) + reward.xp;
    const newLevel = calculateLevel(newXp);

    await supabase.from('profiles').update({
      xp_points: newXp,
      level: newLevel,
      last_login_date: today,
      login_cycle_day: dayInCycle,
    }).eq('id', user.id);

    return NextResponse.json({
      dayInCycle,
      xpAwarded: reward.xp,
      isJackpot: reward.isJackpot,
      totalXp: newXp,
      level: newLevel,
    });
  } catch (error) {
    console.error('Daily login error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login reward failed' },
      { status: 500 }
    );
  }
}
