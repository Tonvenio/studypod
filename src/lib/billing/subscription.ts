import { createClient } from '@/lib/supabase/server';
import { getPlanLimits, type PlanLimits } from './plans';

export interface UserSubscription {
  plan: string;
  status: string;
  limits: PlanLimits;
  usage: { decksCreated: number; audioCardsRendered: number };
  canCreateDeck: boolean;
  canRenderAudio: boolean;
  canUploadDocument: boolean;
  isPro: boolean;
}

export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const supabase = await createClient();

  // Get subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', userId)
    .single();

  let plan = 'free';
  if (sub && sub.status === 'active') {
    // Check if not expired
    if (sub.current_period_end && new Date(sub.current_period_end) > new Date()) {
      plan = sub.plan;
    }
  }

  const limits = getPlanLimits(plan);

  // Get current period usage
  const periodStart = new Date();
  periodStart.setDate(1); // First of current month
  const periodKey = periodStart.toISOString().slice(0, 10);

  const { data: usage } = await supabase
    .from('usage')
    .select('decks_created, audio_cards_rendered')
    .eq('user_id', userId)
    .eq('period_start', periodKey)
    .single();

  const decksCreated = usage?.decks_created || 0;
  const audioCardsRendered = usage?.audio_cards_rendered || 0;

  return {
    plan,
    status: sub?.status || 'none',
    limits,
    usage: { decksCreated, audioCardsRendered },
    canCreateDeck: decksCreated < limits.decksPerMonth,
    canRenderAudio: audioCardsRendered < limits.audioCardsPerDeck * limits.decksPerMonth,
    canUploadDocument: limits.documentUpload,
    isPro: plan !== 'free',
  };
}

export async function incrementUsage(
  userId: string,
  field: 'decks_created' | 'audio_cards_rendered' | 'documents_uploaded',
  amount: number = 1,
): Promise<void> {
  const supabase = await createClient();
  const periodStart = new Date();
  periodStart.setDate(1);
  const periodKey = periodStart.toISOString().slice(0, 10);

  // Upsert usage
  const { data: existing } = await supabase
    .from('usage')
    .select('id, ' + field)
    .eq('user_id', userId)
    .eq('period_start', periodKey)
    .single();

  if (existing) {
    await supabase
      .from('usage')
      .update({ [field]: (existing[field] || 0) + amount })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('usage')
      .insert({ user_id: userId, period_start: periodKey, [field]: amount });
  }
}
