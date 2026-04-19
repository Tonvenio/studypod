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
      {/* Pixel Progress Bar */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[#6B7A99]">
          {cardNumber}/{totalCards}
        </span>
        <div className="flex-1 mx-4 pixel-progress pixel-border-sm overflow-hidden">
          <div
            className="pixel-progress-fill bg-[#7B5CFF]"
            style={{ width: `${(cardNumber / totalCards) * 100}%` }}
          />
        </div>
        <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[#00E896]">
          {Math.round((cardNumber / totalCards) * 100)}%
        </span>
      </div>

      {/* Card */}
      <div
        className="relative w-full aspect-[3/2] cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={flip}
      >
        <div
          className="absolute inset-0 flip-transition"
          style={{
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 pixel-border bg-[#151A2B] border-2 border-[#2A3352] p-8 flex flex-col items-center justify-center text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[#7B5CFF] uppercase tracking-wider mb-4">QUESTION</span>
            <p className="text-xl md:text-2xl font-semibold leading-relaxed">{front}</p>
            <p className="font-[family-name:var(--font-press-start)] text-[8px] text-[#6B7A99] mt-6">PRESS SPACE TO REVEAL</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 pixel-border bg-[#151A2B] border-2 border-[#7B5CFF]/40 p-8 flex flex-col items-center justify-center text-center overflow-y-auto"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[#00E896] uppercase tracking-wider mb-4">ANSWER</span>
            <p className="text-lg md:text-xl font-medium leading-relaxed mb-4">{back}</p>
            {explanation && (
              <p className="text-sm text-[#6B7A99] leading-relaxed border-t-2 border-[#2A3352] pt-4 mt-2">
                {explanation}
              </p>
            )}
            {audioUrl && (
              <button
                onClick={(e) => { e.stopPropagation(); playAudio(); }}
                className="mt-4 flex items-center gap-2 pixel-border-sm bg-[#7B5CFF]/10 hover:bg-[#7B5CFF]/20 text-[#7B5CFF] px-4 py-2 text-sm font-medium transition-pixel"
              >
                {isPlaying ? '▶ PLAYING...' : '▶ LISTEN'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rating buttons — game controller style */}
      {isFlipped && onRate && (
        <div className="grid grid-cols-4 gap-2 mt-6">
          {[
            { key: 'again' as const, label: 'AGAIN', color: 'bg-[#FF6B8A]', hint: '1' },
            { key: 'hard' as const, label: 'HARD', color: 'bg-[#FFD93D] text-[#0B0E17]', hint: '2' },
            { key: 'good' as const, label: 'GOOD', color: 'bg-[#7B5CFF]', hint: '3' },
            { key: 'easy' as const, label: 'EASY', color: 'bg-[#00E896] text-[#0B0E17]', hint: '4' },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => onRate(btn.key)}
              className={`${btn.color} pixel-border-sm py-3 text-sm font-bold hover:opacity-90 transition-pixel`}
            >
              {btn.label}
              <span className="block font-[family-name:var(--font-press-start)] text-[8px] opacity-60 mt-0.5">{btn.hint}</span>
            </button>
          ))}
        </div>
      )}

      <p className="font-[family-name:var(--font-press-start)] text-[8px] text-[#6B7A99] text-center mt-3">
        SPACE = FLIP · 1-4 = RATE
      </p>
    </div>
  );
}
