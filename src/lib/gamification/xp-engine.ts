// ── Level & XP Curve ────────────────────────────────────────────
// Formula: xp_needed = floor(40 * level^1.85)
// Level 2: 40 XP, Level 5: 571 XP, Level 10: 2830 XP, Level 20: 15700 XP

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(40 * Math.pow(level, 1.85));
}

export function calculateLevel(xp: number): number {
  if (xp <= 0) return 1;
  // Binary-ish search: the inverse formula undershoots due to floor(),
  // so we estimate then verify
  let level = Math.max(1, Math.floor(Math.pow(xp / 40, 1 / 1.85)));
  // Bump up while XP qualifies for the next level
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function xpProgress(xp: number): {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  progress: number; // 0-1
  isImminent: boolean; // within 20% of next level
} {
  const level = calculateLevel(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const delta = nextLevelXp - currentLevelXp;
  const progress = delta > 0 ? (xp - currentLevelXp) / delta : 0;
  return {
    level,
    currentXp: xp - currentLevelXp,
    nextLevelXp: delta,
    progress: Math.min(1, Math.max(0, progress)),
    isImminent: progress >= 0.8,
  };
}

// ── Titles ──────────────────────────────────────────────────────

const TITLES: [number, string][] = [
  [1, 'Noob'],
  [3, 'Apprentice'],
  [5, 'Student'],
  [8, 'Scholar'],
  [12, 'Sage'],
  [16, 'Wizard'],
  [20, 'Sorcerer'],
  [25, 'Archmage'],
  [30, 'Legend'],
  [40, 'Mythic'],
  [50, 'Grandmaster'],
];

export function getTitle(level: number): string {
  let title = 'Noob';
  for (const [minLevel, t] of TITLES) {
    if (level >= minLevel) title = t;
  }
  return title;
}

// ── XP Awards ───────────────────────────────────────────────────

export const XP_VALUES = {
  DECK_CREATED_TOPIC: 25,
  DECK_CREATED_UPLOAD: 35,
  CARD_LISTENED: 5,
  SESSION_START: 10,
  CARD_CORRECT: 8,
  CARD_WRONG: 3,
  ON_TIME_REVIEW_BONUS: 3,
  OVERDUE_RESCUE_BONUS: 5,
  SPEED_BONUS_10S: 3,
  SPEED_BONUS_5S: 5,
} as const;

// ── Combo System ────────────────────────────────────────────────
// Consecutive correct answers build a multiplier

export function comboMultiplier(comboCount: number): number {
  if (comboCount >= 10) return 5;
  if (comboCount >= 7) return 4;
  if (comboCount >= 5) return 3;
  if (comboCount >= 3) return 2;
  return 1;
}

export function comboLabel(comboCount: number): string | null {
  if (comboCount >= 10) return 'UNSTOPPABLE';
  if (comboCount >= 7) return 'DOMINATING';
  if (comboCount >= 5) return 'ON FIRE';
  if (comboCount >= 3) return 'COMBO';
  return null;
}

// ── Critical Hits ───────────────────────────────────────────────
// 15% chance on correct answer = 3x XP for that card

export const CRIT_CHANCE = 0.15;
export const CRIT_MULTIPLIER = 3;

export function rollCrit(): boolean {
  return Math.random() < CRIT_CHANCE;
}

// ── Loot Drops ──────────────────────────────────────────────────
// Every 25 cards reviewed, get a mystery chest

export const LOOT_DROP_INTERVAL = 25;

export interface LootDrop {
  tier: 'bronze' | 'silver' | 'gold';
  xp: number;
}

export function rollLoot(): LootDrop {
  const roll = Math.random();
  if (roll < 0.05) return { tier: 'gold', xp: 100 };
  if (roll < 0.25) return { tier: 'silver', xp: 50 };
  return { tier: 'bronze', xp: 20 };
}

// ── Streak Multiplier ───────────────────────────────────────────

export function streakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 2.0;
  if (streakDays >= 14) return 1.8;
  if (streakDays >= 7) return 1.5;
  if (streakDays >= 3) return 1.2;
  return 1.0;
}

export function streakLabel(streakDays: number): string | null {
  if (streakDays >= 30) return 'UNSTOPPABLE';
  if (streakDays >= 14) return 'ON FIRE';
  if (streakDays >= 7) return 'HEATING UP';
  if (streakDays >= 3) return 'STREAK';
  return null;
}

// ── Daily Login Rewards ─────────────────────────────────────────
// 7-day escalating cycle, resets on miss

export const LOGIN_REWARDS = [5, 10, 15, 20, 25, 35, 50]; // Day 1-7

export function loginRewardForDay(dayInCycle: number): {
  xp: number;
  isJackpot: boolean;
} {
  const idx = Math.min(dayInCycle - 1, LOGIN_REWARDS.length - 1);
  const xp = LOGIN_REWARDS[idx] || 5;
  return { xp, isJackpot: dayInCycle >= 7 };
}

// ── Speed Bonus ─────────────────────────────────────────────────

export function speedBonus(answerTimeMs: number): number {
  if (answerTimeMs <= 5000) return XP_VALUES.SPEED_BONUS_5S;
  if (answerTimeMs <= 10000) return XP_VALUES.SPEED_BONUS_10S;
  return 0;
}

// ── Session Summary ─────────────────────────────────────────────

export interface SessionResult {
  totalXp: number;
  baseXp: number;
  comboBonus: number;
  critBonus: number;
  speedBonus: number;
  streakBonus: number;
  lootXp: number;
  cardsReviewed: number;
  correctCount: number;
  bestCombo: number;
  critsLanded: number;
  cardsLeveledUp: number;
  perfectRound: boolean;
  lootDrops: LootDrop[];
  levelBefore: number;
  levelAfter: number;
  leveledUp: boolean;
}

// ── Card Mastery ────────────────────────────────────────────────

export const MASTERY_TIERS = [
  { tier: 0, name: 'New', stars: 0, minCorrectStreak: 0 },
  { tier: 1, name: 'Learning', stars: 1, minCorrectStreak: 1 },
  { tier: 2, name: 'Familiar', stars: 2, minCorrectStreak: 3 },
  { tier: 3, name: 'Known', stars: 3, minCorrectStreak: 5 },
  { tier: 4, name: 'Mastered', stars: 4, minCorrectStreak: 8 },
] as const;

export function calculateMasteryTier(correctStreak: number, repetitions: number): number {
  if (correctStreak >= 8 && repetitions >= 10) return 4;
  if (correctStreak >= 5 && repetitions >= 6) return 3;
  if (correctStreak >= 3 && repetitions >= 3) return 2;
  if (correctStreak >= 1) return 1;
  return 0;
}

export function masteryName(tier: number): string {
  return MASTERY_TIERS[tier]?.name || 'New';
}

// ── Perfect Round ───────────────────────────────────────────────

export const PERFECT_ROUND_MULTIPLIER = 1.5;

// ── Quest Definitions ───────────────────────────────────────────

export interface QuestDefinition {
  type: string;
  label: string;
  target: number;
  xpReward: number;
}

export const QUEST_POOL: QuestDefinition[] = [
  { type: 'review_10', label: 'Review 10 cards', target: 10, xpReward: 20 },
  { type: 'review_25', label: 'Review 25 cards', target: 25, xpReward: 40 },
  { type: 'create_deck', label: 'Create a deck', target: 1, xpReward: 15 },
  { type: 'listen_5', label: 'Listen to 5 audio cards', target: 5, xpReward: 15 },
  { type: 'correct_streak_5', label: '5 correct in a row', target: 5, xpReward: 25 },
  { type: 'correct_streak_10', label: '10 correct in a row', target: 10, xpReward: 50 },
  { type: 'review_overdue', label: 'Rescue 5 overdue cards', target: 5, xpReward: 20 },
  { type: 'perfect_round', label: 'Get a perfect round', target: 1, xpReward: 30 },
  { type: 'speed_round_3', label: '3 speed answers (< 5s)', target: 3, xpReward: 20 },
  { type: 'earn_crit', label: 'Land a critical hit', target: 1, xpReward: 15 },
];

export function pickDailyQuests(count: number = 3): QuestDefinition[] {
  const shuffled = [...QUEST_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ── Badge Definitions ───────────────────────────────────────────

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  icon: string; // pixel-art emoji placeholder
}

export const BADGES: BadgeDefinition[] = [
  { key: 'first_quest', name: 'First Quest', description: 'Create your first deck', icon: '⚔️' },
  { key: 'sound_check', name: 'Sound Check', description: 'Listen to your first audio card', icon: '🎧' },
  { key: 'scholar_100', name: 'Scholar', description: 'Review 100 cards', icon: '📚' },
  { key: 'streak_7', name: 'Streak Warrior', description: '7-day study streak', icon: '🔥' },
  { key: 'perfectionist_3', name: 'Perfectionist', description: '3 perfect review rounds', icon: '💎' },
  { key: 'librarian_10', name: 'Librarian', description: 'Create 10 decks', icon: '🏛️' },
  { key: 'marathon_30', name: 'Marathon', description: '30-day study streak', icon: '🏆' },
  { key: 'upload_master_5', name: 'Upload Master', description: 'Create 5 decks from documents', icon: '📄' },
  { key: 'combo_king', name: 'Combo King', description: 'Reach a 10x combo', icon: '⚡' },
  { key: 'crit_collector', name: 'Crit Collector', description: 'Land 50 critical hits', icon: '💥' },
  { key: 'speed_demon', name: 'Speed Demon', description: '10 speed answers in one session', icon: '⏱️' },
  { key: 'card_master', name: 'Card Master', description: 'Fully master 50 cards', icon: '⭐' },
  { key: 'loot_hunter', name: 'Loot Hunter', description: 'Open 10 mystery chests', icon: '🎁' },
  { key: 'gold_chest', name: 'Jackpot', description: 'Find a gold chest', icon: '👑' },
];
