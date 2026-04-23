import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processReview, type SimpleGrade } from '@/lib/gamification/spaced-repetition';
import {
  XP_VALUES, speedBonus, comboMultiplier, rollCrit, CRIT_MULTIPLIER,
  rollLoot, LOOT_DROP_INTERVAL, PERFECT_ROUND_MULTIPLIER,
  calculateMasteryTier, calculateLevel,
} from '@/lib/gamification/xp-engine';

interface ReviewPayload {
  flashcardId: string;
  grade: SimpleGrade;
  answerTimeMs: number;
  comboCount: number;      // client tracks combo
  sessionCardIndex: number; // how many cards reviewed this session (for loot)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body: ReviewPayload = await request.json();
    const { flashcardId, grade, answerTimeMs, comboCount, sessionCardIndex } = body;

    if (!flashcardId || !grade) {
      return NextResponse.json({ error: 'flashcardId and grade are required' }, { status: 400 });
    }

    // Get or create card progress
    const { data: existing } = await supabase
      .from('card_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('flashcard_id', flashcardId)
      .single();

    const currentState = existing ? {
      easeFactor: parseFloat(existing.ease_factor) || 2.5,
      intervalDays: existing.interval_days || 0,
      repetitions: existing.repetitions || 0,
      nextReviewAt: new Date(existing.next_review_at),
      correctStreak: existing.correct_streak || 0,
      totalReviews: existing.total_reviews || 0,
      totalCorrect: existing.total_correct || 0,
    } : {
      easeFactor: 2.5,
      intervalDays: 0,
      repetitions: 0,
      nextReviewAt: new Date(),
      correctStreak: 0,
      totalReviews: 0,
      totalCorrect: 0,
    };

    // Process SM-2 review
    const now = new Date();
    const result = processReview(currentState, grade, now);
    const { newState, wasCorrect, masteryChanged, newMasteryTier } = result;

    // Calculate XP
    const xpEvents: { action: string; xp: number; metadata?: Record<string, unknown> }[] = [];
    let totalXp = 0;

    // Base XP
    const baseXp = wasCorrect ? XP_VALUES.CARD_CORRECT : XP_VALUES.CARD_WRONG;
    xpEvents.push({ action: 'card_reviewed', xp: baseXp });
    totalXp += baseXp;

    // Combo bonus
    if (wasCorrect && comboCount >= 3) {
      const mult = comboMultiplier(comboCount);
      const bonus = baseXp * (mult - 1);
      xpEvents.push({ action: 'combo_bonus', xp: bonus, metadata: { combo: comboCount, multiplier: mult } });
      totalXp += bonus;
    }

    // Speed bonus
    const speed = speedBonus(answerTimeMs);
    if (speed > 0 && wasCorrect) {
      xpEvents.push({ action: 'speed_bonus', xp: speed, metadata: { answerTimeMs } });
      totalXp += speed;
    }

    // Critical hit
    let isCrit = false;
    if (wasCorrect && rollCrit()) {
      isCrit = true;
      const critBonus = baseXp * (CRIT_MULTIPLIER - 1);
      xpEvents.push({ action: 'crit_hit', xp: critBonus });
      totalXp += critBonus;
    }

    // Overdue rescue bonus
    if (existing && wasCorrect) {
      const wasOverdue = new Date(existing.next_review_at) < now;
      if (wasOverdue) {
        xpEvents.push({ action: 'overdue_rescue', xp: XP_VALUES.OVERDUE_RESCUE_BONUS });
        totalXp += XP_VALUES.OVERDUE_RESCUE_BONUS;
      }
    }

    // Mastery level up bonus
    if (masteryChanged && newMasteryTier > result.oldMasteryTier) {
      const masteryXp = newMasteryTier * 10;
      xpEvents.push({ action: 'mastery_up', xp: masteryXp, metadata: { tier: newMasteryTier } });
      totalXp += masteryXp;
    }

    // Loot drop check
    let lootDrop = null;
    if ((sessionCardIndex + 1) % LOOT_DROP_INTERVAL === 0) {
      lootDrop = rollLoot();
      xpEvents.push({ action: 'loot_drop', xp: lootDrop.xp, metadata: { tier: lootDrop.tier } });
      totalXp += lootDrop.xp;
    }

    // Upsert card progress
    const progressData = {
      user_id: user.id,
      flashcard_id: flashcardId,
      ease_factor: newState.easeFactor,
      interval_days: newState.intervalDays,
      repetitions: newState.repetitions,
      next_review_at: newState.nextReviewAt.toISOString(),
      last_reviewed_at: now.toISOString(),
      correct_streak: newState.correctStreak,
      total_reviews: newState.totalReviews,
      total_correct: newState.totalCorrect,
      mastery_tier: newMasteryTier,
    };

    if (existing) {
      await supabase.from('card_progress').update(progressData)
        .eq('user_id', user.id).eq('flashcard_id', flashcardId);
    } else {
      await supabase.from('card_progress').insert(progressData);
    }

    // Award XP
    if (xpEvents.length > 0) {
      await supabase.from('xp_events').insert(
        xpEvents.map(e => ({
          user_id: user.id,
          action: e.action,
          xp_amount: e.xp,
          metadata: e.metadata || {},
        }))
      );
    }

    // Calculate streak
    const today = new Date().toISOString().slice(0, 10);
    const { data: profileForStreak } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_study_date, total_cards_reviewed, best_combo, total_crits')
      .eq('id', user.id)
      .single();

    let currentStreak = profileForStreak?.current_streak || 0;
    let longestStreak = profileForStreak?.longest_streak || 0;
    const lastStudyDate = profileForStreak?.last_study_date;

    if (lastStudyDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      currentStreak = lastStudyDate === yesterdayStr ? currentStreak + 1 : 1;
      if (currentStreak > longestStreak) longestStreak = currentStreak;
    }

    // Atomic XP update (prevents race conditions under concurrent submissions)
    const { data: xpResult } = await supabase.rpc('increment_xp', {
      p_user_id: user.id,
      p_xp_amount: totalXp,
      p_was_correct: wasCorrect,
      p_is_crit: isCrit,
      p_combo: wasCorrect ? comboCount + 1 : 0,
      p_streak: currentStreak,
      p_longest_streak: longestStreak,
      p_study_date: today,
    });

    const newXp = xpResult?.[0]?.new_xp ?? 0;
    const newLevel = xpResult?.[0]?.new_level ?? calculateLevel(newXp);

    // Award badges (fire-and-forget)
    const newTotalReviewed = (profileForStreak?.total_cards_reviewed || 0) + 1;
    const newBestCombo = Math.max(profileForStreak?.best_combo || 0, wasCorrect ? comboCount + 1 : 0);
    const badgesToAward: string[] = [];
    if (newTotalReviewed === 1) badgesToAward.push('first_quest');
    if (newTotalReviewed >= 100) badgesToAward.push('scholar_100');
    if (currentStreak >= 7) badgesToAward.push('streak_7');
    if (currentStreak >= 30) badgesToAward.push('marathon_30');
    if (newBestCombo >= 10) badgesToAward.push('combo_king');
    if ((profileForStreak?.total_crits || 0) + (isCrit ? 1 : 0) >= 50) badgesToAward.push('crit_collector');
    if (newMasteryTier >= 4) badgesToAward.push('card_master');
    if (lootDrop?.tier === 'gold') badgesToAward.push('gold_chest');

    if (badgesToAward.length > 0) {
      await supabase.from('badges').upsert(
        badgesToAward.map(key => ({ user_id: user.id, badge_key: key })),
        { onConflict: 'user_id,badge_key', ignoreDuplicates: true }
      ).catch(() => {});
    }

    return NextResponse.json({
      xpAwarded: totalXp,
      xpEvents,
      totalXp: newXp,
      level: newLevel,
      isCrit,
      lootDrop,
      wasCorrect,
      newMasteryTier,
      masteryChanged,
      newState: {
        intervalDays: newState.intervalDays,
        nextReviewAt: newState.nextReviewAt.toISOString(),
        correctStreak: newState.correctStreak,
      },
    });
  } catch (error) {
    console.error('Review error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Review failed' },
      { status: 500 }
    );
  }
}
