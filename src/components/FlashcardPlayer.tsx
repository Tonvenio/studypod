'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface FlashcardPlayerProps {
  front: string;
  back: string;
  explanation: string;
  audioUrl?: string | null;
  onRate?: (rating: 'again' | 'hard' | 'good' | 'easy') => void;
  cardNumber: number;
  totalCards: number;
}

export default function FlashcardPlayer({
  front,
  back,
  explanation,
  audioUrl,
  onRate,
  cardNumber,
  totalCards,
}: FlashcardPlayerProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const flip = useCallback(() => setIsFlipped((f) => !f), []);

  // Reset flip state when card changes
  const prevFront = useRef(front);
  if (prevFront.current !== front) {
    prevFront.current = front;
    if (isFlipped) setIsFlipped(false);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); flip(); }
      if (isFlipped && onRate) {
        if (e.key === '1') onRate('again');
        if (e.key === '2') onRate('hard');
        if (e.key === '3') onRate('good');
        if (e.key === '4') onRate('easy');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFlipped, flip, onRate]);

  const playAudio = () => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.play();
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4 text-sm text-[#94A3B8]">
        <span>{cardNumber} / {totalCards}</span>
        <div className="flex-1 mx-4 h-1.5 bg-[#334155] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#6C3AED] rounded-full transition-all duration-300"
            style={{ width: `${(cardNumber / totalCards) * 100}%` }}
          />
        </div>
        <span>{Math.round((cardNumber / totalCards) * 100)}%</span>
      </div>

      {/* Card */}
      <div
        className="relative w-full aspect-[3/2] cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={flip}
      >
        <div
          className="absolute inset-0 transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-[#1E293B] border border-[#334155] rounded-2xl p-8 flex flex-col items-center justify-center text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-xs text-[#6C3AED] font-semibold uppercase tracking-wider mb-4">Question</span>
            <p className="text-xl md:text-2xl font-semibold leading-relaxed">{front}</p>
            <p className="text-sm text-[#94A3B8] mt-6">Tap to reveal answer</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-[#1E293B] border border-[#6C3AED]/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center overflow-y-auto"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-xs text-[#10B981] font-semibold uppercase tracking-wider mb-4">Answer</span>
            <p className="text-lg md:text-xl font-medium leading-relaxed mb-4">{back}</p>
            {explanation && (
              <p className="text-sm text-[#94A3B8] leading-relaxed border-t border-[#334155] pt-4 mt-2">
                {explanation}
              </p>
            )}
            {audioUrl && (
              <button
                onClick={(e) => { e.stopPropagation(); playAudio(); }}
                className="mt-4 flex items-center gap-2 bg-[#6C3AED]/10 hover:bg-[#6C3AED]/20 text-[#6C3AED] rounded-xl px-4 py-2 text-sm font-medium transition-colors"
              >
                {isPlaying ? 'Playing...' : 'Listen'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rating buttons */}
      {isFlipped && onRate && (
        <div className="grid grid-cols-4 gap-2 mt-6">
          {[
            { key: 'again' as const, label: 'Again', color: 'bg-[#FB7185]', hint: '1' },
            { key: 'hard' as const, label: 'Hard', color: 'bg-[#F59E0B]', hint: '2' },
            { key: 'good' as const, label: 'Good', color: 'bg-[#6C3AED]', hint: '3' },
            { key: 'easy' as const, label: 'Easy', color: 'bg-[#10B981]', hint: '4' },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => onRate(btn.key)}
              className={`${btn.color} hover:opacity-90 text-white rounded-xl py-3 text-sm font-semibold transition-opacity`}
            >
              {btn.label}
              <span className="block text-xs opacity-60 mt-0.5">{btn.hint}</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-[#94A3B8] text-center mt-3">
        Space to flip · 1-4 to rate
      </p>
    </div>
  );
}
