'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

let pendingFile: File | null = null;
export function getPendingFile(): File | null {
  const f = pendingFile;
  pendingFile = null;
  return f;
}

export default function HeroInput() {
  const [mode, setMode] = useState<'topic' | 'upload'>('topic');
  const [topic, setTopic] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleSubmitTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    router.push(`/deck/new?topic=${encodeURIComponent(topic.trim())}`);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    pendingFile = file;
    setFileName(file.name);
    router.push('/deck/new?mode=upload&pending=true');
  }

  return (
    <div className="max-w-xl mx-auto mb-4 px-1">
      {/* Mode toggle */}
      <div className="flex justify-center gap-1 mb-4">
        <button
          onClick={() => setMode('topic')}
          className={`font-[family-name:var(--font-press-start)] text-[8px] sm:text-[10px] px-4 sm:px-5 py-2.5 pixel-border-sm transition-pixel ${
            mode === 'topic'
              ? 'bg-[var(--c-primary)] text-white'
              : 'bg-[var(--c-surface)] text-[var(--c-muted)] hover:text-[var(--c-fg)]'
          }`}
        >
          TOPIC
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`font-[family-name:var(--font-press-start)] text-[8px] sm:text-[10px] px-4 sm:px-5 py-2.5 pixel-border-sm transition-pixel ${
            mode === 'upload'
              ? 'bg-[var(--c-primary)] text-white'
              : 'bg-[var(--c-surface)] text-[var(--c-muted)] hover:text-[var(--c-fg)]'
          }`}
        >
          UPLOAD
        </button>
      </div>

      {mode === 'topic' ? (
        <form onSubmit={handleSubmitTopic}>
          <div className="pixel-border bg-[var(--c-surface)] p-1 relative">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter your study topic..."
              className="w-full bg-transparent px-4 sm:px-5 py-3.5 sm:py-4 sm:pr-32 text-[var(--c-fg)] placeholder:text-[var(--c-muted)] focus:outline-none text-base sm:text-lg"
            />
            <button
              type="submit"
              className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 pixel-border-sm bg-[var(--c-accent)] text-[var(--c-bg)] font-bold px-5 py-2.5 text-sm hover:bg-[var(--c-accent-hover)] transition-pixel"
            >
              GENERATE
            </button>
          </div>
          <button
            type="submit"
            className="sm:hidden w-full mt-2 pixel-border-sm bg-[var(--c-accent)] text-[var(--c-bg)] font-bold px-5 py-3 text-sm hover:bg-[var(--c-accent-hover)] transition-pixel"
          >
            GENERATE
          </button>
        </form>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.csv"
            onChange={handleFile}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full pixel-border bg-[var(--c-surface)] p-6 sm:p-8 text-center hover:bg-[var(--c-surface-hover)] transition-pixel group"
          >
            <span className="font-[family-name:var(--font-press-start)] text-xs sm:text-sm text-[var(--c-muted)] group-hover:text-[var(--c-fg)]">
              {fileName || 'DROP OR CLICK TO UPLOAD'}
            </span>
            <p className="text-[var(--c-muted)] text-xs mt-2">PDF, TXT, MD, CSV</p>
          </button>
        </>
      )}

      <p className="font-[family-name:var(--font-press-start)] text-[7px] sm:text-[8px] text-[var(--c-muted)] text-center mt-3">
        FREE &bull; NO ACCOUNT REQUIRED
      </p>
    </div>
  );
}
