'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';

// In-memory file store — survives client-side navigation
let pendingFile: File | null = null;

export function getPendingFile(): File | null {
  const f = pendingFile;
  pendingFile = null;
  return f;
}

export default function HeroUploadLink() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    pendingFile = file;
    router.push('/deck/new?mode=upload&pending=true');
  }

  return (
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
        className="font-[family-name:var(--font-press-start)] text-[7px] sm:text-[8px] text-[var(--c-accent)] hover:text-[var(--c-accent-hover)] transition-pixel py-3"
      >
        OR UPLOAD A DOCUMENT &#9654;
      </button>
    </>
  );
}
