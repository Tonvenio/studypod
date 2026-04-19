'use client';

import { useState } from 'react';

interface PodcastSubscribeProps {
  feedUrl: string;
}

export default function PodcastSubscribe({ feedUrl }: PodcastSubscribeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[var(--c-surface)] border border-[var(--c-border)] pixel-border p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-[var(--c-primary)]/10 pixel-border-sm flex items-center justify-center">
          <svg className="w-5 h-5 text-[var(--c-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold">Listen as podcast</h3>
          <p className="text-sm text-[var(--c-muted)]">Subscribe in your favorite podcast app</p>
        </div>
      </div>

      {/* Feed URL + Copy */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={feedUrl}
          readOnly
          className="flex-1 bg-[var(--c-bg)] border border-[var(--c-border)] pixel-border-sm px-4 py-2.5 text-sm text-[var(--c-muted)] font-mono truncate focus:outline-none"
        />
        <button
          onClick={handleCopy}
          className={`shrink-0 px-4 py-2.5 pixel-border-sm text-sm font-semibold transition-pixel ${
            copied
              ? 'bg-[var(--c-accent)] text-white'
              : 'bg-[var(--c-primary)] hover:bg-[var(--c-primary-hover)] text-white'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* How to subscribe */}
      <div className="bg-[var(--c-bg)] pixel-border-sm p-4">
        <p className="text-sm font-medium mb-3">How to subscribe:</p>
        <ol className="text-sm text-[var(--c-muted)] space-y-2">
          <li className="flex gap-2">
            <span className="text-[var(--c-primary)] font-bold shrink-0">1.</span>
            <span>Copy the feed URL above</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--c-primary)] font-bold shrink-0">2.</span>
            <span>Open Apple Podcasts, Pocket Casts, or Overcast</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--c-primary)] font-bold shrink-0">3.</span>
            <span>Go to &quot;Add podcast by URL&quot; and paste the link</span>
          </li>
        </ol>
        <p className="text-xs text-[var(--c-muted)]/60 mt-3">
          New flashcards will appear automatically in your podcast app.
        </p>
      </div>
    </div>
  );
}
