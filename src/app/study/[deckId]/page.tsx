'use client';

import { useState } from 'react';
import Link from 'next/link';
import FlashcardPlayer from '@/components/FlashcardPlayer';

const MOCK_CARDS = [
  { id: '1', front: 'What is photosynthesis?', back: 'The process by which plants convert light energy into chemical energy using CO2 and water.', explanation: '6CO2 + 6H2O + light energy = C6H12O6 + 6O2', audioUrl: null, difficulty: 2 },
  { id: '2', front: 'Where does photosynthesis primarily occur?', back: 'In the chloroplasts of plant cells, specifically in the thylakoid membranes and stroma.', explanation: 'Chloroplasts contain chlorophyll, the green pigment that captures light energy.', audioUrl: null, difficulty: 1 },
  { id: '3', front: 'What are the two main stages of photosynthesis?', back: 'Light-dependent reactions (thylakoid membranes) and the Calvin cycle / light-independent reactions (stroma).', explanation: 'Light reactions produce ATP and NADPH; the Calvin cycle uses them to fix CO2 into glucose.', audioUrl: null, difficulty: 3 },
];

type Rating = 'again' | 'hard' | 'good' | 'easy';

export default function StudyPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [isComplete, setIsComplete] = useState(false);

  const cards = MOCK_CARDS;
  const currentCard = cards[currentIndex];

  const handleRate = (rating: Rating) => {
    setRatings((prev) => ({ ...prev, [currentCard.id]: rating }));

    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsComplete(true);
    }
  };

  if (isComplete) {
    const correct = Object.values(ratings).filter((r) => r === 'good' || r === 'easy').length;
    return (
      <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-fg)] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">&#9876;&#65039;</div>
          <h1 className="font-[family-name:var(--font-press-start)] text-2xl mb-2 text-[var(--c-xp)]">QUEST COMPLETE!</h1>
          <p className="text-[var(--c-muted)] mb-2">
            You studied {cards.length} cards
          </p>
          <div className="pixel-border bg-[var(--c-surface)] p-4 mb-6 inline-block">
            <span className="font-[family-name:var(--font-press-start)] text-lg text-[var(--c-accent)]">{correct}/{cards.length}</span>
            <span className="text-[var(--c-muted)] ml-2 text-sm">cards mastered</span>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setCurrentIndex(0); setRatings({}); setIsComplete(false); }}
              className="pixel-border-sm bg-[var(--c-primary)] hover:bg-[var(--c-primary-hover)] text-white px-6 py-3 font-semibold transition-pixel"
            >
              Study again
            </button>
            <Link href="/" className="pixel-border-sm bg-[var(--c-surface)] hover:bg-[var(--c-surface-hover)] border-2 border-[var(--c-border)] text-white px-6 py-3 font-semibold transition-pixel">
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-fg)] flex flex-col">
      <nav className="border-b-2 border-[var(--c-border)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-press-start)] text-sm">
            <span className="text-[var(--c-primary)]">study</span><span className="text-[var(--c-fg)]">pod</span><span className="text-[var(--c-accent)]">.ai</span>
          </Link>
          <Link href="/" className="text-sm text-[var(--c-muted)] hover:text-white transition-pixel">
            Exit
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <FlashcardPlayer
          front={currentCard.front}
          back={currentCard.back}
          explanation={currentCard.explanation}
          audioUrl={currentCard.audioUrl}
          onRate={handleRate}
          cardNumber={currentIndex + 1}
          totalCards={cards.length}
        />
      </div>
    </main>
  );
}
