'use client';

import { useEffect, useState } from 'react';
import { getTitle } from '@/lib/gamification/xp-engine';

interface LevelUpOverlayProps {
  level: number;
  onDismiss: () => void;
}

export default function LevelUpOverlay({ level, onDismiss }: LevelUpOverlayProps) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');
  const title = getTitle(level);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 100);
    const t2 = setTimeout(() => setPhase('exit'), 3000);
    const t3 = setTimeout(onDismiss, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDismiss]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 transition-opacity duration-300 ${
        phase === 'enter' ? 'opacity-0' : phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={onDismiss}
    >
      <div className={`text-center transition-transform duration-500 ${
        phase === 'show' ? 'scale-100' : 'scale-50'
      }`}>
        {/* Pixel stars */}
        <div className="flex justify-center gap-2 mb-4">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className="font-[family-name:var(--font-press-start)] text-2xl text-[var(--c-xp)]"
              style={{ animationDelay: `${i * 100}ms`, animation: 'float-up 2s ease-out infinite alternate' }}
            >
              ★
            </span>
          ))}
        </div>

        <p className="font-[family-name:var(--font-press-start)] text-sm text-[var(--c-muted)] mb-2">
          ACHIEVEMENT UNLOCKED
        </p>

        <p className="font-[family-name:var(--font-press-start)] text-4xl text-[var(--c-xp)] mb-3 animate-level-up pixel-shadow">
          LEVEL {level}
        </p>

        <p className="font-[family-name:var(--font-press-start)] text-lg text-[var(--c-accent)]">
          {title.toUpperCase()}
        </p>

        <p className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)] mt-6">
          CLICK TO CONTINUE
        </p>
      </div>
    </div>
  );
}
