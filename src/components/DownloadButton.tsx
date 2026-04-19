'use client';

import { useState } from 'react';

interface DownloadButtonProps {
  cardId: string;
  size?: 'sm' | 'md';
}

export default function DownloadButton({ cardId, size = 'sm' }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/download/${cardId}`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studypod-${cardId}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (size === 'sm') {
    return (
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        title="Download MP3"
        className="w-8 h-8 flex items-center justify-center text-[var(--c-muted)] hover:text-[var(--c-primary)] hover:bg-[var(--c-primary)]/10 pixel-border-sm transition-pixel disabled:opacity-50"
      >
        {isDownloading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="flex items-center gap-2 text-sm text-[var(--c-muted)] hover:text-[var(--c-primary)] bg-[var(--c-border)]/50 hover:bg-[var(--c-primary)]/10 pixel-border-sm px-3 py-2 transition-pixel disabled:opacity-50"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {isDownloading ? 'Downloading...' : 'Download MP3'}
    </button>
  );
}
