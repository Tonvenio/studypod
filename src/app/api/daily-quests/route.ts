import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pickDailyQuests } from '@/lib/gamification/xp-engine';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const today = new Date().toISOString().slice(0, 10);

    // Check if quests already generated for today
    const { data: existing } = await supabase
      .from('daily_quests')
      .select('*')
      .eq('user_id', user.id)
      .eq('quest_date', today);

    if (existing && existing.length > 0) {
      return NextResponse.json({ quests: existing });
    }

    // Generate new daily quests
    const selected = pickDailyQuests(3);
    const questRows = selected.map((q) => ({
      user_id: user.id,
      quest_date: today,
      quest_type: q.type,
      quest_label: q.label,
      target: q.target,
      progress: 0,
      xp_reward: q.xpReward,
      completed: false,
    }));

    const { data: inserted, error } = await supabase
      .from('daily_quests')
      .insert(questRows)
      .select('*');

    if (error) {
      console.error('Quest insert error:', error);
      return NextResponse.json({ quests: [] });
    }

    return NextResponse.json({ quests: inserted });
  } catch (error) {
    console.error('Daily quests error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 },
    );
  }
}
