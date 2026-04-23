'use client';

import { useState, useRef, useEffect } from 'react';

interface AudioMiniPlayerProps {
  src: string;
  title?: string;
}

export default function AudioMiniPlayer({ src, title }: AudioMiniPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play();
    setIsPlaying(!isPlaying);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = Math.max(0, Math.min(1, pct)) * duration;
  };

  const seekTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.changedTouches[0].clientX - rect.left) / rect.width;
    audio.currentTime = Math.max(0, Math.min(1, pct)) * duration;
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 1.75, 2];
    const next = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    setPlaybackRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 pixel-border bg-[var(--c-surface)] px-4 py-2.5">
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        onClick={togglePlay}
        className="w-11 h-11 flex items-center justify-center pixel-border-sm bg-[var(--c-primary)] hover:bg-[var(--c-primary-hover)] text-white text-sm transition-pixel shrink-0"
      >
        {isPlaying ? '||' : '\u25B6'}
      </button>

      <div className="flex-1 min-w-0">
        {title && <p className="text-[10px] text-[var(--c-muted)] truncate mb-1 font-mono">{title}</p>}
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)] w-10 shrink-0">{formatTime(progress)}</span>
          <div className="flex-1 pixel-progress pixel-border-sm cursor-pointer py-3" style={{ height: '32px' }} onClick={seek} onTouchEnd={seekTouch}>
            <div
              className="pixel-progress-fill bg-[var(--c-primary)]"
              style={{ width: duration ? `${(progress / duration) * 100}%` : '0%', height: '100%' }}
            />
          </div>
          <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)] w-10 shrink-0 text-right">{formatTime(duration)}</span>
        </div>
      </div>

      <button
        onClick={cycleSpeed}
        className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)] hover:text-[var(--c-fg)] pixel-border-sm bg-[var(--c-border)] px-2.5 py-2.5 transition-pixel shrink-0"
      >
        {playbackRate}x
      </button>
    </div>
  );
}
