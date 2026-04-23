'use client';

import { useEffect, useState } from 'react';
import { xpProgress, getTitle } from '@/lib/gamification/xp-engine';

interface XpBarProps {
  xp: number;
  compact?: boolean;
}

export default function XpBar({ xp, compact = false }: XpBarProps) {
  const progress = xpProgress(xp);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    requestAnimationFrame(() => setAnimated(true));
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-xp)]">
          LV.{progress.level}
        </span>
        <div className={`w-20 h-2 bg-[var(--c-border)] pixel-border-sm overflow-hidden ${progress.isImminent ? 'animate-xp-pulse' : ''}`}>
          <div
            className="h-full bg-[var(--c-xp)] transition-all duration-500"
            style={{ width: animated ? `${progress.progress * 100}%` : '0%' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pixel-border bg-[var(--c-surface)] p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-press-start)] text-sm text-[var(--c-xp)]">
            LV.{progress.level}
          </span>
          <span className="text-xs text-[var(--c-muted)]">{getTitle(progress.level)}</span>
        </div>
        <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)]">
          {progress.currentXp}/{progress.nextLevelXp} XP
        </span>
      </div>
      <div className={`h-3 bg-[var(--c-border)] pixel-border-sm overflow-hidden ${progress.isImminent ? 'animate-xp-pulse' : ''}`}>
        <div
          className="h-full bg-[var(--c-xp)] transition-all duration-700"
          style={{ width: animated ? `${progress.progress * 100}%` : '0%' }}
        />
      </div>
      {progress.isImminent && (
        <p className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-xp)] mt-2 animate-pulse text-center">
          LEVEL UP IMMINENT!
        </p>
      )}
    </div>
  );
}
