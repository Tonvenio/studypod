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
      <main className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">&#127881;</div>
          <h1 className="text-3xl font-bold mb-2">Session complete!</h1>
          <p className="text-[#94A3B8] mb-6">
            You studied {cards.length} cards — {correct}/{cards.length} correct
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setCurrentIndex(0); setRatings({}); setIsComplete(false); }}
              className="bg-[#6C3AED] hover:bg-[#5B21B6] text-white rounded-xl px-6 py-3 font-semibold transition-colors"
            >
              Study again
            </button>
            <Link href="/" className="bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-white rounded-xl px-6 py-3 font-semibold transition-colors">
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex flex-col">
      <nav className="border-b border-[#334155]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span className="text-[#6C3AED]">study</span>pod<span className="text-[#10B981]">.ai</span>
          </Link>
          <Link href="/" className="text-sm text-[#94A3B8] hover:text-white transition-colors">
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
