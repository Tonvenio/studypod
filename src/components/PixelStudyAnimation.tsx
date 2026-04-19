'use client';

import { useEffect, useState } from 'react';

export default function PixelStudyAnimation() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % 4);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-48 h-48 mx-auto" aria-hidden="true">
      {/* Character */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 32 32"
          className="w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        >
          {/* Desk */}
          <rect x="4" y="24" width="24" height="2" fill="var(--c-border)" />
          <rect x="6" y="26" width="2" height="4" fill="var(--c-border)" />
          <rect x="24" y="26" width="2" height="4" fill="var(--c-border)" />

          {/* Laptop on desk */}
          <rect x="10" y="22" width="10" height="2" fill="var(--c-muted)" />
          <rect x="11" y="20" width="8" height="2" fill="var(--c-primary)" />
          {/* Screen glow */}
          <rect x="12" y="20" width="6" height="1" fill="var(--c-accent)" opacity="0.6" />

          {/* Body */}
          <rect x="13" y="16" width="6" height="6" fill="var(--c-primary)" />

          {/* Arms */}
          <rect x="11" y="18" width="2" height="4" fill="var(--c-primary)" />
          <rect x="19" y="18" width="2" height="4" fill="var(--c-primary)" />

          {/* Head - moves with frame */}
          <g transform={`translate(0, ${frame === 1 || frame === 3 ? -0.5 : 0})`}>
            {/* Head */}
            <rect x="13" y="10" width="6" height="6" fill="#FFD4A8" />

            {/* Hair */}
            <rect x="12" y="9" width="8" height="2" fill="var(--c-fg)" />
            <rect x="12" y="10" width="1" height="3" fill="var(--c-fg)" />
            <rect x="19" y="10" width="1" height="3" fill="var(--c-fg)" />

            {/* Eyes - blink on frame 2 */}
            {frame === 2 ? (
              <>
                <rect x="14" y="13" width="2" height="0.5" fill="var(--c-bg)" />
                <rect x="17" y="13" width="2" height="0.5" fill="var(--c-bg)" />
              </>
            ) : (
              <>
                <rect x="14" y="12" width="2" height="2" fill="var(--c-bg)" />
                <rect x="17" y="12" width="2" height="2" fill="var(--c-bg)" />
                <rect x="15" y="13" width="1" height="1" fill="var(--c-fg)" />
                <rect x="18" y="13" width="1" height="1" fill="var(--c-fg)" />
              </>
            )}

            {/* Smile */}
            <rect x="15" y="14" width="2" height="1" fill="var(--c-danger)" opacity="0.7" />

            {/* Headphones */}
            <rect x="11" y="10" width="1" height="5" fill="var(--c-accent)" />
            <rect x="20" y="10" width="1" height="5" fill="var(--c-accent)" />
            <rect x="11" y="9" width="10" height="1" fill="var(--c-accent)" />
            {/* Ear cups */}
            <rect x="10" y="11" width="2" height="3" fill="var(--c-accent)" />
            <rect x="20" y="11" width="2" height="3" fill="var(--c-accent)" />
          </g>

          {/* Musical notes - animated */}
          <g opacity={frame % 2 === 0 ? 1 : 0.5}>
            <text
              x="6"
              y={9 - (frame % 2)}
              fill="var(--c-xp)"
              fontSize="4"
              fontFamily="var(--font-press-start), monospace"
            >
              ♪
            </text>
          </g>
          <g opacity={frame % 2 === 1 ? 1 : 0.5}>
            <text
              x="24"
              y={7 - ((frame + 1) % 2)}
              fill="var(--c-accent)"
              fontSize="3"
              fontFamily="var(--font-press-start), monospace"
            >
              ♫
            </text>
          </g>
          <g opacity={frame === 0 || frame === 2 ? 0.8 : 0.3}>
            <text
              x="3"
              y={5 - (frame % 3) * 0.5}
              fill="var(--c-primary)"
              fontSize="3"
              fontFamily="var(--font-press-start), monospace"
            >
              ♪
            </text>
          </g>
        </svg>
      </div>

      {/* Label */}
      <div className="absolute -bottom-6 left-0 right-0 text-center">
        <span className="font-[family-name:var(--font-press-start)] text-[6px] text-[var(--c-muted)]">
          {['STUDYING...', 'LEARNING!', 'STUDYING...', 'LEVEL UP!'][frame]}
        </span>
      </div>
    </div>
  );
}
