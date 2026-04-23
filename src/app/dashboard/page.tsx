'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import XpBar from '@/components/XpBar';
import LevelUpOverlay from '@/components/LevelUpOverlay';
import { getTitle, streakLabel, streakMultiplier, LOGIN_REWARDS, BADGES } from '@/lib/gamification/xp-engine';
import Nav from '@/components/Nav';

interface Profile {
  xp_points: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  total_cards_reviewed: number;
  total_correct: number;
  best_combo: number;
  total_crits: number;
  total_decks_created: number;
  streak_shields: number;
  login_cycle_day: number;
}

interface Deck {
  id: string;
  topic: string;
  card_count: number;
  created_at: string;
}

interface DueInfo {
  deckId: string;
  topic: string;
  dueCount: number;
}

interface DailyQuest {
  id: string;
  quest_type: string;
  quest_label: string;
  target: number;
  progress: number;
  xp_reward: number;
  completed: boolean;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [dueDecks, setDueDecks] = useState<DueInfo[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [loginReward, setLoginReward] = useState<{ dayInCycle: number; xp: number; isJackpot: boolean; claimed: boolean } | null>(null);
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Load profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (prof) setProfile(prof as Profile);

      // Load decks
      const { data: userDecks } = await supabase
        .from('decks')
        .select('id, topic, card_count, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (userDecks) setDecks(userDecks as Deck[]);

      // Load earned badges
      const { data: badges } = await supabase
        .from('badges')
        .select('badge_key')
        .eq('user_id', user.id);

      if (badges) setEarnedBadges(badges.map((b: { badge_key: string }) => b.badge_key));

      // Check due cards per deck (scoped via flashcards join)
      if (userDecks && userDecks.length > 0) {
        const now = new Date().toISOString();
        const dueInfos: DueInfo[] = [];
        for (const deck of userDecks.slice(0, 5)) {
          const { count } = await supabase
            .from('card_progress')
            .select('*, flashcards!inner(deck_id)', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('flashcards.deck_id', deck.id)
            .lte('next_review_at', now);
          if (count && count > 0) {
            dueInfos.push({ deckId: deck.id, topic: deck.topic, dueCount: count });
          }
        }
        setDueDecks(dueInfos);
      }

      // Claim daily login (once per browser session)
      if (sessionStorage.getItem('studypod-login-claimed')) {
        // Already claimed this session
      } else {
        const loginRes = await fetch('/api/daily-login', { method: 'POST' });
        sessionStorage.setItem('studypod-login-claimed', '1');
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          if (!loginData.alreadyClaimed) {
            setLoginReward({
              dayInCycle: loginData.dayInCycle,
              xp: loginData.xpAwarded,
              isJackpot: loginData.isJackpot,
              claimed: true,
            });
            if (prof) {
              setProfile(p => p ? { ...p, xp_points: loginData.totalXp, level: loginData.level } : p);
            }
          }
        }
      }
      // Load daily quests
      const questsRes = await fetch('/api/daily-quests');
      if (questsRes.ok) {
        const questsData = await questsRes.json();
        setDailyQuests(questsData.quests || []);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <main className="min-h-dvh bg-[var(--c-bg)] text-[var(--c-fg)] flex items-center justify-center">
        <p className="font-[family-name:var(--font-press-start)] text-xs text-[var(--c-muted)]">LOADING BASE...</p>
      </main>
    );
  }

  // Fallback for non-authenticated users
  const xp = profile?.xp_points || 0;
  const level = profile?.level || 1;
  const streak = profile?.current_streak || 0;
  const streakMult = streakMultiplier(streak);
  const streakLbl = streakLabel(streak);
  const title = getTitle(level);

  return (
    <main className="min-h-dvh bg-[var(--c-bg)] text-[var(--c-fg)]">
      {showLevelUp && (
        <LevelUpOverlay level={level} onDismiss={() => setShowLevelUp(false)} />
      )}

      <Nav rightContent={<>
        <div className="hidden sm:block">
          <XpBar xp={xp} compact />
        </div>
        <Link href="/settings" className="text-xs text-[var(--c-muted)] hover:text-[var(--c-fg)] transition-pixel py-2">
          Settings
        </Link>
        <Link href="/" className="text-xs text-[var(--c-muted)] hover:text-[var(--c-fg)] transition-pixel py-2">
          New Quest
        </Link>
      </>} />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Daily Login Reward Banner */}
        {loginReward && (
          <div className={`pixel-border mb-6 p-4 text-center ${loginReward.isJackpot ? 'bg-[var(--c-xp)]/10 border-[var(--c-xp)]' : 'bg-[var(--c-accent)]/10'}`}>
            <p className="font-[family-name:var(--font-press-start)] text-xs text-[var(--c-xp)] mb-1">
              {loginReward.isJackpot ? 'JACKPOT! DAY 7 BONUS!' : `DAILY LOGIN — DAY ${loginReward.dayInCycle}`}
            </p>
            <p className="font-[family-name:var(--font-press-start)] text-lg text-[var(--c-accent)]">+{loginReward.xp} XP</p>
            {/* Show cycle progress */}
            <div className="flex justify-center gap-1 mt-2">
              {LOGIN_REWARDS.map((reward, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 flex items-center justify-center pixel-border-sm text-[8px] font-[family-name:var(--font-press-start)] ${
                    i < loginReward.dayInCycle
                      ? 'bg-[var(--c-accent)] text-[var(--c-bg)]'
                      : 'bg-[var(--c-surface)] text-[var(--c-muted)]'
                  }`}
                >
                  {reward}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cards Due Alert */}
        {dueDecks.length > 0 && (
          <div className="pixel-border bg-[var(--c-danger)]/10 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-[family-name:var(--font-press-start)] text-xs text-[var(--c-danger)] mb-1 animate-pulse">
                  CARDS FALLING BEHIND!
                </p>
                <p className="text-sm text-[var(--c-muted)]">
                  {dueDecks.reduce((sum, d) => sum + d.dueCount, 0)} cards due for review — rescue them for bonus XP!
                </p>
              </div>
              <Link
                href={`/review/${dueDecks[0].deckId}`}
                className="pixel-border-sm bg-[var(--c-danger)] text-white px-4 py-2.5 font-[family-name:var(--font-press-start)] text-[10px] hover:opacity-90 transition-pixel shrink-0"
              >
                RESCUE
              </Link>
            </div>
          </div>
        )}

        {/* Player Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Level + XP */}
          <div className="pixel-border bg-[var(--c-surface)] p-4 sm:p-5">
            <p className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)] mb-2">RANK</p>
            <p className="font-[family-name:var(--font-press-start)] text-2xl sm:text-3xl text-[var(--c-primary)] mb-1">LV.{level}</p>
            <p className="font-[family-name:var(--font-press-start)] text-[10px] sm:text-xs text-[var(--c-accent)]">{title}</p>
            <div className="mt-3">
              <XpBar xp={xp} />
            </div>
          </div>

          {/* Streak */}
          <div className="pixel-border bg-[var(--c-surface)] p-5">
            <p className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)] mb-2">STREAK</p>
            <div className="flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-press-start)] text-3xl text-[var(--c-accent)]">{streak}</span>
              <span className="text-sm text-[var(--c-muted)]">days</span>
            </div>
            {streakLbl && (
              <p className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-danger)] mt-1">{streakLbl} — {streakMult}x MULTIPLIER</p>
            )}
            {profile?.streak_shields && profile.streak_shields > 0 ? (
              <p className="text-xs text-[var(--c-muted)] mt-2">
                {'🛡️'.repeat(profile.streak_shields)} {profile.streak_shields} shield{profile.streak_shields > 1 ? 's' : ''} saved
              </p>
            ) : null}
            <p className="text-xs text-[var(--c-muted)] mt-1">Best: {profile?.longest_streak || 0} days</p>
          </div>

          {/* Stats */}
          <div className="pixel-border bg-[var(--c-surface)] p-5">
            <p className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)] mb-2">STATS</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--c-muted)]">Cards reviewed</span>
                <span className="text-[var(--c-fg)]">{profile?.total_cards_reviewed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--c-muted)]">Accuracy</span>
                <span className="text-[var(--c-accent)]">
                  {profile && profile.total_cards_reviewed > 0
                    ? Math.round((profile.total_correct / profile.total_cards_reviewed) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--c-muted)]">Best combo</span>
                <span className="text-[var(--c-xp)]">{profile?.best_combo || 0}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--c-muted)]">Total crits</span>
                <span className="text-[var(--c-danger)]">{profile?.total_crits || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-8">
          <h2 className="font-[family-name:var(--font-press-start)] text-sm text-[var(--c-xp)] mb-4">BADGES</h2>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
            {BADGES.map((badge) => {
              const earned = earnedBadges.includes(badge.key);
              return (
                <div
                  key={badge.key}
                  className={`pixel-border-sm p-3 text-center ${
                    earned ? 'bg-[var(--c-surface)]' : 'bg-[var(--c-surface)] opacity-30'
                  }`}
                  title={`${badge.name}: ${badge.description}`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <p className="font-[family-name:var(--font-press-start)] text-[6px] text-[var(--c-muted)] mt-1 truncate">
                    {badge.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Decks / Quests */}
        {/* Daily Quests */}
        {dailyQuests.length > 0 && (
          <div className="mb-8">
            <h2 className="font-[family-name:var(--font-press-start)] text-xs sm:text-sm text-[var(--c-accent)] mb-4">DAILY QUESTS</h2>
            <div className="grid gap-2">
              {dailyQuests.map((quest) => (
                <div
                  key={quest.id}
                  className={`pixel-border bg-[var(--c-surface)] p-4 flex items-center justify-between ${quest.completed ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-[family-name:var(--font-press-start)] text-[10px] ${quest.completed ? 'text-[var(--c-accent)]' : 'text-[var(--c-muted)]'}`}>
                      {quest.completed ? '✓' : '○'}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{quest.quest_label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-20 h-1.5 bg-[var(--c-border)] pixel-border-sm overflow-hidden">
                          <div
                            className="h-full bg-[var(--c-accent)]"
                            style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }}
                          />
                        </div>
                        <span className="font-[family-name:var(--font-press-start)] text-[7px] text-[var(--c-muted)]">
                          {quest.progress}/{quest.target}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-xp)]">+{quest.xp_reward} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="font-[family-name:var(--font-press-start)] text-sm text-[var(--c-primary)] mb-4">YOUR DECKS</h2>
        {decks.length === 0 ? (
          <div className="pixel-border bg-[var(--c-surface)] p-8 text-center">
            <p className="text-[var(--c-muted)] mb-4">No decks yet. Start your first quest!</p>
            <Link
              href="/"
              className="pixel-border-sm bg-[var(--c-primary)] hover:bg-[var(--c-primary-hover)] text-white px-6 py-3 font-semibold transition-pixel"
            >
              CREATE DECK
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {decks.map((deck) => {
              const due = dueDecks.find(d => d.deckId === deck.id);
              return (
                <div
                  key={deck.id}
                  className="pixel-border bg-[var(--c-surface)] p-5 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold">{deck.topic}</p>
                    <p className="text-sm text-[var(--c-muted)]">
                      {deck.card_count} cards
                      {due && (
                        <span className="text-[var(--c-danger)] ml-2 font-[family-name:var(--font-press-start)] text-[8px]">
                          {due.dueCount} DUE
                        </span>
                      )}
                    </p>
                  </div>
                  <Link
                    href={`/review/${deck.id}`}
                    className="pixel-border-sm bg-[var(--c-primary)] hover:bg-[var(--c-primary-hover)] text-white px-4 py-2.5 text-sm font-semibold transition-pixel shrink-0"
                  >
                    {due ? 'REVIEW' : 'STUDY'}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
