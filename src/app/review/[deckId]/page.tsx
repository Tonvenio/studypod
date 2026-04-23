'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Nav from '@/components/Nav';
import {
  xpProgress, getTitle, comboMultiplier, comboLabel,
  MASTERY_TIERS, type LootDrop, type SessionResult,
} from '@/lib/gamification/xp-engine';

type SimpleGrade = 'again' | 'hard' | 'good' | 'easy';
type ReviewStage = 'loading' | 'reviewing' | 'summary' | 'error';

interface ReviewCard {
  flashcardId: string;
  front: string;
  back: string;
  explanation: string;
  difficulty: number;
  masteryTier: number;
  isNew: boolean;
}

interface ReviewResponse {
  xpAwarded: number;
  isCrit: boolean;
  lootDrop: LootDrop | null;
  wasCorrect: boolean;
  newMasteryTier: number;
  masteryChanged: boolean;
  totalXp: number;
  level: number;
}

export default function ReviewPage() {
  const params = useParams();
  const deckId = params.deckId as string;

  const [stage, setStage] = useState<ReviewStage>('loading');
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState('');

  // Gamification state
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [totalXpSession, setTotalXpSession] = useState(0);
  const [sessionCards, setSessionCards] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [critsLanded, setCritsLanded] = useState(0);
  const [cardsLeveledUp, setCardsLeveledUp] = useState(0);
  const [lootDrops, setLootDrops] = useState<LootDrop[]>([]);
  const [currentXp, setCurrentXp] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [levelBefore, setLevelBefore] = useState(1);

  // Animation states
  const [showCrit, setShowCrit] = useState(false);
  const [showComboPopup, setShowComboPopup] = useState<string | null>(null);
  const [showLoot, setShowLoot] = useState<LootDrop | null>(null);
  const [showMasteryUp, setShowMasteryUp] = useState<number | null>(null);
  const [showXpFloat, setShowXpFloat] = useState<number | null>(null);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [speedTimer, setSpeedTimer] = useState(0);
  const [isGrading, setIsGrading] = useState(false);

  const flipTimeRef = useRef<number>(0);
  const speedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load due cards
  useEffect(() => {
    async function loadCards() {
      try {
        const res = await fetch(`/api/due-cards?deckId=${deckId}`);
        if (!res.ok) throw new Error('Failed to load cards');
        const data = await res.json();

        const reviewCards: ReviewCard[] = [
          ...(data.dueCards || []).map((d: Record<string, unknown>) => {
            const fc = d.flashcard as Record<string, unknown>;
            return {
              flashcardId: fc.id as string,
              front: fc.front as string,
              back: fc.back as string,
              explanation: (fc.explanation as string) || '',
              difficulty: (fc.difficulty as number) || 3,
              masteryTier: (d.masteryTier as number) || 0,
              isNew: false,
            };
          }),
          ...(data.newCards || []).map((c: Record<string, unknown>) => ({
            flashcardId: c.id as string,
            front: c.front as string,
            back: c.back as string,
            explanation: (c.explanation as string) || '',
            difficulty: (c.difficulty as number) || 3,
            masteryTier: 0,
            isNew: true,
          })),
        ];

        if (reviewCards.length === 0) {
          setError('No cards due for review! Come back later.');
          setStage('error');
          return;
        }

        setCards(reviewCards);
        setStage('reviewing');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
        setStage('error');
      }
    }
    loadCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  // Speed timer
  useEffect(() => {
    if (stage === 'reviewing' && !isFlipped) {
      setSpeedTimer(0);
      const start = Date.now();
      speedIntervalRef.current = setInterval(() => {
        setSpeedTimer(Math.floor((Date.now() - start) / 100) / 10);
      }, 100);
    }
    return () => {
      if (speedIntervalRef.current) clearInterval(speedIntervalRef.current);
    };
  }, [stage, isFlipped, currentIndex]);

  const flip = useCallback(() => {
    if (!isFlipped) {
      setIsFlipped(true);
      flipTimeRef.current = Date.now();
      if (speedIntervalRef.current) clearInterval(speedIntervalRef.current);
    }
  }, [isFlipped]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); flip(); }
      if (isFlipped) {
        if (e.key === '1') handleGrade('again');
        if (e.key === '2') handleGrade('hard');
        if (e.key === '3') handleGrade('good');
        if (e.key === '4') handleGrade('easy');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFlipped, flip, currentIndex, combo]);

  async function handleGrade(grade: SimpleGrade) {
    if (isGrading) return;
    const card = cards[currentIndex];
    if (!card) return;
    setIsGrading(true);

    const answerTimeMs = Date.now() - flipTimeRef.current;

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flashcardId: card.flashcardId,
          grade,
          answerTimeMs,
          comboCount: grade !== 'again' ? combo + 1 : 0,
          sessionCardIndex: sessionCards,
        }),
      });

      if (!res.ok) {
        // If not authenticated, still allow local review
        advanceCard(grade !== 'again', 0, false, null, false, 0);
        return;
      }

      const data: ReviewResponse = await res.json();

      // Trigger animations
      if (data.isCrit) {
        setShowCrit(true);
        setCritsLanded(c => c + 1);
        setTimeout(() => setShowCrit(false), 1200);
      }

      if (data.lootDrop) {
        setLootDrops(prev => [...prev, data.lootDrop!]);
        setTimeout(() => {
          setShowLoot(data.lootDrop);
          setTimeout(() => setShowLoot(null), 2500);
        }, data.isCrit ? 1300 : 300);
      }

      if (data.masteryChanged && data.newMasteryTier > card.masteryTier) {
        setCardsLeveledUp(c => c + 1);
        setShowMasteryUp(data.newMasteryTier);
        setTimeout(() => setShowMasteryUp(null), 1500);
      }

      // XP float
      if (data.xpAwarded > 0) {
        setShowXpFloat(data.xpAwarded);
        setTimeout(() => setShowXpFloat(null), 1000);
      }

      setCurrentXp(data.totalXp);
      setCurrentLevel(data.level);

      advanceCard(
        data.wasCorrect,
        data.xpAwarded,
        data.isCrit,
        data.lootDrop,
        data.masteryChanged,
        data.newMasteryTier,
      );
    } catch {
      advanceCard(grade !== 'again', 0, false, null, false, 0);
    }
  }

  function advanceCard(
    correct: boolean,
    xpAwarded: number,
    _isCrit: boolean,
    _loot: LootDrop | null,
    _masteryUp: boolean,
    _newTier: number,
  ) {
    setTotalXpSession(t => t + xpAwarded);
    setSessionCards(s => s + 1);

    if (correct) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setBestCombo(b => Math.max(b, newCombo));
      setCorrectCount(c => c + 1);

      const label = comboLabel(newCombo);
      if (label && newCombo >= 3) {
        setShowComboPopup(label);
        setShakeScreen(true);
        setTimeout(() => { setShowComboPopup(null); setShakeScreen(false); }, 800);
      }
    } else {
      setCombo(0);
    }

    // Advance to next card or summary
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(i => i + 1);
        setIsFlipped(false);
      } else {
        setStage('summary');
      }
      setIsGrading(false);
    }, 400);
  }

  const currentCard = cards[currentIndex];
  const progress = xpProgress(currentXp);
  const comboMult = comboMultiplier(combo);

  // ── LOADING ─────────────────────────────────────────────────
  if (stage === 'loading') {
    return (
      <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-fg)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <svg className="w-10 h-10 text-[var(--c-primary)] animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="font-[family-name:var(--font-press-start)] text-xs text-[var(--c-muted)]">LOADING QUEST...</p>
        </div>
      </main>
    );
  }

  // ── ERROR ───────────────────────────────────────────────────
  if (stage === 'error') {
    return (
      <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-fg)] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="font-[family-name:var(--font-press-start)] text-sm text-[var(--c-xp)] mb-4">NO QUESTS AVAILABLE</p>
          <p className="text-[var(--c-muted)] mb-6">{error}</p>
          <Link href="/dashboard" className="pixel-border-sm bg-[var(--c-primary)] text-white px-6 py-3 font-semibold transition-pixel">
            RETURN TO BASE
          </Link>
        </div>
      </main>
    );
  }

  // ── SESSION SUMMARY ─────────────────────────────────────────
  if (stage === 'summary') {
    const perfectRound = correctCount === cards.length && cards.length > 0;
    const leveledUp = currentLevel > levelBefore;
    const accuracy = cards.length > 0 ? Math.round((correctCount / cards.length) * 100) : 0;

    return (
      <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-fg)] flex items-center justify-center px-3">
        <div className="max-w-lg w-full mx-auto px-1 sm:px-4 py-6 text-center">
          {/* Level up celebration */}
          {leveledUp && (
            <div className="mb-6 sm:mb-8 animate-bounce">
              <p className="font-[family-name:var(--font-press-start)] text-base sm:text-lg text-[var(--c-xp)] mb-2">LEVEL UP!</p>
              <p className="font-[family-name:var(--font-press-start)] text-2xl sm:text-3xl text-[var(--c-accent)]">LV.{currentLevel}</p>
              <p className="text-sm text-[var(--c-muted)] mt-1">{getTitle(currentLevel)}</p>
            </div>
          )}

          {!leveledUp && (
            <div className="mb-6">
              <p className="font-[family-name:var(--font-press-start)] text-lg text-[var(--c-xp)] mb-2">
                {perfectRound ? 'PERFECT CLEAR!' : 'QUEST COMPLETE!'}
              </p>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <div className="pixel-border bg-[var(--c-surface)] p-4">
              <p className="font-[family-name:var(--font-press-start)] text-2xl text-[var(--c-accent)]">+{totalXpSession}</p>
              <p className="text-xs text-[var(--c-muted)] mt-1">XP EARNED</p>
            </div>
            <div className="pixel-border bg-[var(--c-surface)] p-4">
              <p className="font-[family-name:var(--font-press-start)] text-2xl text-[var(--c-primary)]">{accuracy}%</p>
              <p className="text-xs text-[var(--c-muted)] mt-1">ACCURACY</p>
            </div>
            <div className="pixel-border bg-[var(--c-surface)] p-4">
              <p className="font-[family-name:var(--font-press-start)] text-2xl text-[var(--c-xp)]">{bestCombo}x</p>
              <p className="text-xs text-[var(--c-muted)] mt-1">BEST COMBO</p>
            </div>
            <div className="pixel-border bg-[var(--c-surface)] p-4">
              <p className="font-[family-name:var(--font-press-start)] text-2xl text-[var(--c-danger)]">{critsLanded}</p>
              <p className="text-xs text-[var(--c-muted)] mt-1">CRITS LANDED</p>
            </div>
          </div>

          {/* Cards reviewed breakdown */}
          <div className="pixel-border bg-[var(--c-surface)] p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--c-muted)]">Cards reviewed</span>
              <span>{cards.length}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--c-muted)]">Correct</span>
              <span className="text-[var(--c-accent)]">{correctCount}</span>
            </div>
            {cardsLeveledUp > 0 && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--c-muted)]">Cards leveled up</span>
                <span className="text-[var(--c-xp)]">{cardsLeveledUp}</span>
              </div>
            )}
            {lootDrops.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--c-muted)]">Chests opened</span>
                <span className="text-[var(--c-accent)]">{lootDrops.length}</span>
              </div>
            )}
          </div>

          {/* XP bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-[var(--c-muted)] mb-1">
              <span>LV.{progress.level} {getTitle(progress.level)}</span>
              <span>{progress.currentXp}/{progress.nextLevelXp} XP</span>
            </div>
            <div className="h-3 bg-[var(--c-border)] pixel-border-sm overflow-hidden">
              <div
                className="h-full bg-[var(--c-primary)] transition-all duration-1000"
                style={{ width: `${progress.progress * 100}%` }}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="pixel-border-sm bg-[var(--c-primary)] hover:bg-[var(--c-primary-hover)] text-white px-6 py-3 font-semibold transition-pixel"
            >
              REVIEW AGAIN
            </button>
            <Link
              href="/dashboard"
              className="pixel-border-sm bg-[var(--c-surface)] hover:bg-[var(--c-surface-hover)] border-2 border-[var(--c-border)] text-white px-6 py-3 font-semibold transition-pixel"
            >
              RETURN TO BASE
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── REVIEW SESSION ──────────────────────────────────────────
  return (
    <main className={`min-h-screen bg-[var(--c-bg)] text-[var(--c-fg)] flex flex-col ${shakeScreen ? 'animate-shake' : ''}`}>
      {/* Top bar: XP + combo + timer */}
      <Nav rightContent={<>
        {/* Mini XP bar */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-xp)]">LV.{progress.level}</span>
          <div className={`w-24 h-2 bg-[var(--c-border)] pixel-border-sm overflow-hidden ${progress.isImminent ? 'animate-pulse' : ''}`}>
            <div
              className="h-full bg-[var(--c-xp)] transition-all duration-300"
              style={{ width: `${progress.progress * 100}%` }}
            />
          </div>
        </div>
        {/* Combo counter */}
        {combo >= 2 && (
          <div className="flex items-center gap-1">
            <span className="font-[family-name:var(--font-press-start)] text-xs text-[var(--c-accent)]">{combo}x</span>
            <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-accent)]">COMBO</span>
          </div>
        )}
        {/* Session XP */}
        <span className="font-[family-name:var(--font-press-start)] text-[10px] text-[var(--c-xp)]">+{totalXpSession} XP</span>
        <Link href="/dashboard" className="text-xs text-[var(--c-muted)] hover:text-[var(--c-fg)] transition-pixel py-2">
          Exit
        </Link>
      </>} />

      <div className="flex-1 flex items-center justify-center px-3 sm:px-4 py-4 sm:py-8 relative">
        {/* Floating XP indicator */}
        {showXpFloat !== null && (
          <div className="absolute top-8 right-8 animate-float-up font-[family-name:var(--font-press-start)] text-lg text-[var(--c-xp)]">
            +{showXpFloat} XP
          </div>
        )}

        {/* Critical hit flash */}
        {showCrit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="animate-crit-flash">
              <p className="font-[family-name:var(--font-press-start)] text-4xl text-[var(--c-danger)]">CRITICAL!</p>
              <p className="font-[family-name:var(--font-press-start)] text-lg text-[var(--c-xp)] text-center">3x XP</p>
            </div>
          </div>
        )}

        {/* Combo popup */}
        {showComboPopup && (
          <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-combo-pop">
            <p className="font-[family-name:var(--font-press-start)] text-2xl text-[var(--c-accent)]">{showComboPopup}!</p>
            <p className="font-[family-name:var(--font-press-start)] text-sm text-[var(--c-accent)] text-center">{comboMult}x MULTIPLIER</p>
          </div>
        )}

        {/* Loot drop */}
        {showLoot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="animate-loot-drop pixel-border bg-[var(--c-surface)] p-8 text-center">
              <p className="font-[family-name:var(--font-press-start)] text-sm text-[var(--c-muted)] mb-2">MYSTERY CHEST</p>
              <p className="text-5xl mb-3">
                {showLoot.tier === 'gold' ? '👑' : showLoot.tier === 'silver' ? '🎁' : '📦'}
              </p>
              <p className={`font-[family-name:var(--font-press-start)] text-lg ${
                showLoot.tier === 'gold' ? 'text-[var(--c-xp)]' :
                showLoot.tier === 'silver' ? 'text-[var(--c-primary)]' :
                'text-[var(--c-accent)]'
              }`}>
                {showLoot.tier.toUpperCase()} CHEST
              </p>
              <p className="font-[family-name:var(--font-press-start)] text-sm text-[var(--c-xp)] mt-1">+{showLoot.xp} XP</p>
            </div>
          </div>
        )}

        {/* Mastery up */}
        {showMasteryUp !== null && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-float-up">
            <div className="pixel-border-sm bg-[var(--c-xp)]/20 px-6 py-3 text-center">
              <p className="font-[family-name:var(--font-press-start)] text-xs text-[var(--c-xp)]">MASTERY UP!</p>
              <p className="text-sm mt-1">
                {'★'.repeat(showMasteryUp)}{'☆'.repeat(4 - showMasteryUp)}
                {' '}<span className="text-[var(--c-muted)]">{MASTERY_TIERS[showMasteryUp]?.name}</span>
              </p>
            </div>
          </div>
        )}

        <div className="w-full max-w-xl mx-auto">
          {/* Progress bar + speed timer */}
          <div className="flex items-center justify-between mb-4">
            <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)]">
              {currentIndex + 1}/{cards.length}
            </span>
            <div className="flex-1 mx-4 h-2 bg-[var(--c-border)] pixel-border-sm overflow-hidden">
              <div
                className="h-full bg-[var(--c-primary)] transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
              />
            </div>
            {/* Speed timer */}
            {!isFlipped && (
              <span className={`font-[family-name:var(--font-press-start)] text-[10px] tabular-nums ${
                speedTimer <= 5 ? 'text-[var(--c-accent)]' :
                speedTimer <= 10 ? 'text-[var(--c-xp)]' :
                'text-[var(--c-muted)]'
              }`}>
                {speedTimer.toFixed(1)}s
              </span>
            )}
            {isFlipped && (
              <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-accent)]">
                {Math.round(((currentIndex + 1) / cards.length) * 100)}%
              </span>
            )}
          </div>

          {/* Card mastery stars */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              {currentCard.isNew && (
                <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-primary)] bg-[var(--c-primary)]/10 px-2 py-0.5">NEW</span>
              )}
              <span className="text-xs text-[var(--c-xp)]">
                {'★'.repeat(currentCard.masteryTier)}{'☆'.repeat(4 - currentCard.masteryTier)}
              </span>
              <span className="text-[8px] text-[var(--c-muted)]">
                {MASTERY_TIERS[currentCard.masteryTier]?.name}
              </span>
            </div>
            {/* Loot progress */}
            {(() => {
              const untilLoot = 25 - (sessionCards % 25);
              return untilLoot <= 5 ? (
                <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-xp)] animate-pulse">
                  CHEST IN {untilLoot}!
                </span>
              ) : null;
            })()}
          </div>

          {/* Card */}
          <div
            className="relative w-full min-h-[200px] sm:min-h-[280px] aspect-auto sm:aspect-[3/2] cursor-pointer"
            style={{ perspective: '1000px' }}
            onClick={flip}
          >
            <div
              className="absolute inset-0 flip-transition"
              style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 pixel-border bg-[var(--c-surface)] border-2 border-[var(--c-border)] p-5 sm:p-8 flex flex-col items-center justify-center text-center"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-primary)] uppercase tracking-wider mb-3 sm:mb-4">QUESTION</span>
                <p className="text-lg sm:text-xl md:text-2xl font-semibold leading-relaxed">{currentCard.front}</p>
                <p className="font-[family-name:var(--font-press-start)] text-[7px] sm:text-[8px] text-[var(--c-muted)] mt-4 sm:mt-6">TAP TO REVEAL</p>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 pixel-border bg-[var(--c-surface)] border-2 border-[#7B5CFF]/40 p-5 sm:p-8 flex flex-col items-center justify-center text-center overflow-y-auto"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-accent)] uppercase tracking-wider mb-3 sm:mb-4">ANSWER</span>
                <p className="text-base sm:text-lg md:text-xl font-medium leading-relaxed mb-3 sm:mb-4">{currentCard.back}</p>
                {currentCard.explanation && (
                  <p className="text-xs sm:text-sm text-[var(--c-muted)] leading-relaxed border-t-2 border-[var(--c-border)] pt-3 sm:pt-4 mt-2">
                    {currentCard.explanation}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Rating buttons */}
          {isFlipped && (
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-4 sm:mt-6">
              {[
                { key: 'again' as SimpleGrade, label: 'AGAIN', color: 'bg-[var(--c-danger)]', hint: '1' },
                { key: 'hard' as SimpleGrade, label: 'HARD', color: 'bg-[var(--c-xp)] text-[var(--c-bg)]', hint: '2' },
                { key: 'good' as SimpleGrade, label: 'GOOD', color: 'bg-[var(--c-primary)]', hint: '3' },
                { key: 'easy' as SimpleGrade, label: 'EASY', color: 'bg-[var(--c-accent)] text-[var(--c-bg)]', hint: '4' },
              ].map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => handleGrade(btn.key)}
                  disabled={isGrading}
                  className={`${btn.color} pixel-border-sm py-3 sm:py-3.5 text-xs sm:text-sm font-bold hover:opacity-90 active:opacity-75 transition-pixel ${isGrading ? 'opacity-50' : ''}`}
                >
                  {btn.label}
                  <span className="hidden sm:block font-[family-name:var(--font-press-start)] text-[8px] opacity-60 mt-0.5">{btn.hint}</span>
                </button>
              ))}
            </div>
          )}

          <p className="font-[family-name:var(--font-press-start)] text-[7px] sm:text-[8px] text-[var(--c-muted)] text-center mt-2 sm:mt-3">
            {combo >= 3 ? `${comboMult}x COMBO ACTIVE` : 'TAP CARD TO FLIP'}
          </p>
        </div>
      </div>
    </main>
  );
}
