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
    audio.currentTime = pct * duration;
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
    <div className="flex items-center gap-3 pixel-border bg-[#151A2B] px-4 py-2.5">
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        onClick={togglePlay}
        className="w-8 h-8 flex items-center justify-center pixel-border-sm bg-[#7B5CFF] hover:bg-[#9B7FFF] text-white text-sm transition-pixel shrink-0"
      >
        {isPlaying ? '||' : '\u25B6'}
      </button>

      <div className="flex-1 min-w-0">
        {title && <p className="text-[10px] text-[#6B7A99] truncate mb-1 font-mono">{title}</p>}
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[#6B7A99] w-10 shrink-0">{formatTime(progress)}</span>
          <div className="flex-1 pixel-progress pixel-border-sm cursor-pointer" style={{ height: '10px' }} onClick={seek}>
            <div
              className="pixel-progress-fill bg-[#7B5CFF]"
              style={{ width: duration ? `${(progress / duration) * 100}%` : '0%', height: '100%' }}
            />
          </div>
          <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[#6B7A99] w-10 shrink-0 text-right">{formatTime(duration)}</span>
        </div>
      </div>

      <button
        onClick={cycleSpeed}
        className="font-[family-name:var(--font-press-start)] text-[8px] text-[#6B7A99] hover:text-[#E8F0E8] pixel-border-sm bg-[#2A3352] px-2 py-1 transition-pixel shrink-0"
      >
        {playbackRate}x
      </button>
    </div>
  );
}
