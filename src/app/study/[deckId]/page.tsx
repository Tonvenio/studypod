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
      <main className="min-h-screen bg-[#0B0E17] text-[#E8F0E8] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">&#9876;&#65039;</div>
          <h1 className="font-[family-name:var(--font-press-start)] text-2xl mb-2 text-[#FFD93D]">QUEST COMPLETE!</h1>
          <p className="text-[#6B7A99] mb-2">
            You studied {cards.length} cards
          </p>
          <div className="pixel-border bg-[#151A2B] p-4 mb-6 inline-block">
            <span className="font-[family-name:var(--font-press-start)] text-lg text-[#00E896]">{correct}/{cards.length}</span>
            <span className="text-[#6B7A99] ml-2 text-sm">cards mastered</span>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setCurrentIndex(0); setRatings({}); setIsComplete(false); }}
              className="pixel-border-sm bg-[#7B5CFF] hover:bg-[#9B7FFF] text-white px-6 py-3 font-semibold transition-pixel"
            >
              Study again
            </button>
            <Link href="/" className="pixel-border-sm bg-[#151A2B] hover:bg-[#1E2540] border-2 border-[#2A3352] text-white px-6 py-3 font-semibold transition-pixel">
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0E17] text-[#E8F0E8] flex flex-col">
      <nav className="border-b-2 border-[#2A3352]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-press-start)] text-sm">
            <span className="text-[#7B5CFF]">study</span><span className="text-[#E8F0E8]">pod</span><span className="text-[#00E896]">.ai</span>
          </Link>
          <Link href="/" className="text-sm text-[#6B7A99] hover:text-white transition-pixel">
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
