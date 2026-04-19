'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AudioMiniPlayer from '@/components/AudioMiniPlayer';
import DownloadButton from '@/components/DownloadButton';
import DownloadAllButton from '@/components/DownloadAllButton';
import PodcastSubscribe from '@/components/PodcastSubscribe';

interface GeneratedCard {
  front: string;
  back: string;
  explanation: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

interface AudioState {
  status: 'idle' | 'rendering' | 'done' | 'error';
  audioUrl?: string;
  durationSeconds?: number;
  error?: string;
}

type Stage = 'input' | 'researching' | 'generating' | 'done' | 'error';

const AUTO_RENDER_COUNT = 2; // Auto-render audio for first N cards

export default function NewDeckPageWrapper() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0B0E17] text-[#E8F0E8] flex items-center justify-center">
        <div className="text-[#6B7A99]">Loading...</div>
      </main>
    }>
      <NewDeckPage />
    </Suspense>
  );
}

function NewDeckPage() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get('topic') || '';

  const [topic, setTopic] = useState(initialTopic);
  const [stage, setStage] = useState<Stage>(initialTopic ? 'researching' : 'input');
  const [progress, setProgress] = useState(0);
  const [cards, setCards] = useState<GeneratedCard[]>([]);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [deckId] = useState(`deck-${Date.now()}`);
  const [audioStates, setAudioStates] = useState<Record<string, AudioState>>({});
  const [renderingCount, setRenderingCount] = useState(0);
  const autoRenderStarted = useRef(false);

  // Auto-start research if topic was provided via URL
  useEffect(() => {
    if (initialTopic) {
      startResearch(initialTopic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderAudioForCard = useCallback(async (card: GeneratedCard, cardId: string) => {
    setAudioStates((prev) => ({ ...prev, [cardId]: { status: 'rendering' } }));
    setRenderingCount((c) => c + 1);

    try {
      const response = await fetch('/api/render-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card: { id: cardId, front: card.front, back: card.back, explanation: card.explanation },
          language: 'de',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Render failed');
      }

      const data = await response.json();
      setAudioStates((prev) => ({
        ...prev,
        [cardId]: { status: 'done', audioUrl: data.audioUrl, durationSeconds: data.durationSeconds },
      }));
    } catch (err) {
      setAudioStates((prev) => ({
        ...prev,
        [cardId]: { status: 'error', error: err instanceof Error ? err.message : 'Failed' },
      }));
    } finally {
      setRenderingCount((c) => c - 1);
    }
  }, []);

  // Auto-render audio for first N cards once flashcards are ready
  useEffect(() => {
    if (stage === 'done' && cards.length > 0 && !autoRenderStarted.current) {
      autoRenderStarted.current = true;
      const toRender = cards.slice(0, AUTO_RENDER_COUNT);
      toRender.forEach((card, i) => {
        const cardId = `${deckId}-${i}`;
        renderAudioForCard(card, cardId);
      });
    }
  }, [stage, cards, deckId, renderAudioForCard]);

  async function startResearch(searchTopic: string) {
    setStage('researching');
    setProgress(10);
    setError('');

    try {
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + Math.random() * 8, 85));
      }, 500);

      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: searchTopic, language: 'de', depth: 'standard' }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      setProgress(90);
      setStage('generating');

      const data = await response.json();
      setCards(data.cards || []);
      setSummary(data.research?.summary || '');
      setProgress(100);
      setStage('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStage('error');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    startResearch(topic.trim());
  }

  const difficultyColor = (d: number) => {
    if (d <= 2) return 'bg-[#00E896]/20 text-[#00E896]';
    if (d <= 3) return 'bg-[#FFD93D]/20 text-[#FFD93D]';
    return 'bg-[#FF6B8A]/20 text-[#FF6B8A]';
  };

  const difficultyLabel = (d: number) =>
    ['', 'Basic', 'Easy', 'Medium', 'Hard', 'Expert'][d] || 'Medium';

  return (
    <main className="min-h-screen bg-[#0B0E17] text-[#E8F0E8]">
      <nav className="border-b border-[#2A3352]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span className="text-[#7B5CFF]">study</span>pod<span className="text-[#00E896]">.ai</span>
          </Link>
          <Link href="/" className="text-sm text-[#6B7A99] hover:text-white transition-pixel">
            Home
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Input stage */}
        {stage === 'input' && (
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-6">Create a new deck</h1>
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter a study topic..."
                  className="w-full bg-[#151A2B] border border-[#2A3352] pixel-border px-6 py-4 pr-32 text-lg text-white placeholder:text-[#6B7A99] focus:outline-none focus:ring-2 focus:ring-[#7B5CFF]"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!topic.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#7B5CFF] hover:bg-[#9B7FFF] disabled:opacity-50 text-white pixel-border-sm px-5 py-2.5 font-semibold transition-pixel"
                >
                  Generate
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Research / Generating stage */}
        {(stage === 'researching' || stage === 'generating') && (
          <div className="text-center py-16">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#7B5CFF]/10 mb-6">
                <svg className="w-10 h-10 text-[#7B5CFF] animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {stage === 'researching' ? 'Researching your topic...' : 'Generating flashcards...'}
              </h2>
              <p className="text-[#6B7A99] mb-1">
                <span className="font-medium text-white">{topic}</span>
              </p>
              <p className="text-sm text-[#6B7A99]">
                {stage === 'researching'
                  ? 'Our AI is deep-diving into the topic and extracting key concepts.'
                  : 'Structuring Q&A pairs and writing dialogue scripts.'}
              </p>
            </div>
            <div className="max-w-md mx-auto">
              <div className="h-2 bg-[#2A3352] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#7B5CFF] rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-[#6B7A99] mt-2">{Math.round(progress)}%</p>
            </div>
          </div>
        )}

        {/* Error stage */}
        {stage === 'error' && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#FF6B8A]/10 mb-6">
              <span className="text-4xl">!</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-[#FF6B8A] mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => startResearch(topic)}
                className="bg-[#7B5CFF] hover:bg-[#9B7FFF] text-white pixel-border-sm px-6 py-3 font-semibold transition-pixel"
              >
                Try again
              </button>
              <button
                onClick={() => { setStage('input'); setError(''); }}
                className="bg-[#151A2B] hover:bg-[#2A3352] border border-[#2A3352] text-white pixel-border-sm px-6 py-3 font-semibold transition-pixel"
              >
                Change topic
              </button>
            </div>
          </div>
        )}

        {/* Done stage — show generated cards with audio */}
        {stage === 'done' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">{topic}</h1>
              {summary && <p className="text-[#6B7A99] mb-4">{summary}</p>}

              {/* Audio rendering status banner */}
              {renderingCount > 0 && (
                <div className="flex items-center gap-3 bg-[#7B5CFF]/10 border border-[#7B5CFF]/30 pixel-border-sm px-4 py-3 mb-4">
                  <svg className="w-5 h-5 text-[#7B5CFF] animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm text-[#7B5CFF]">
                    Rendering audio ({renderingCount} card{renderingCount > 1 ? 's' : ''})... Dialogue + TTS + FFmpeg
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/study/${deckId}`}
                  className="bg-[#7B5CFF] hover:bg-[#9B7FFF] text-white pixel-border-sm px-6 py-3 font-semibold transition-pixel"
                >
                  Start studying ({cards.length} cards)
                </Link>
                <button
                  onClick={async () => {
                    const res = await fetch(`/api/export-anki?deckId=${deckId}`);
                    if (!res.ok) return;
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `studypod-${topic.toLowerCase().replace(/\s+/g, '-')}.apkg`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-2 bg-[#00E896] hover:bg-[#33FFAA] text-white pixel-border-sm px-5 py-3 font-semibold transition-pixel"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download for Anki
                </button>
                <DownloadAllButton deckId={deckId} topic={topic} cardCount={Object.values(audioStates).filter(a => a.status === 'done').length} />
              </div>
            </div>

            {/* Podcast Subscribe */}
            <div className="mb-8">
              <PodcastSubscribe feedUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/feed/demo-feed-token`} />
            </div>

            <h2 className="text-xl font-semibold mb-4">Generated cards</h2>
            <div className="grid gap-3">
              {cards.map((card, i) => {
                const cardId = `${deckId}-${i}`;
                const audio = audioStates[cardId];

                return (
                  <div key={i} className="bg-[#151A2B] border border-[#2A3352] pixel-border p-5 hover:border-[#7B5CFF]/30 transition-pixel">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-[#6B7A99]">#{i + 1}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyColor(card.difficulty)}`}>
                        {difficultyLabel(card.difficulty)}
                      </span>
                      {audio?.status === 'done' && audio.durationSeconds && (
                        <span className="text-xs text-[#00E896]">
                          {Math.floor(audio.durationSeconds / 60)}:{String(audio.durationSeconds % 60).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    <p className="font-medium mb-1">{card.front}</p>
                    <p className="text-sm text-[#6B7A99]">{card.back}</p>
                    {card.explanation && (
                      <p className="text-xs text-[#6B7A99]/70 mt-2 border-t border-[#2A3352] pt-2">{card.explanation}</p>
                    )}

                    {/* Audio section */}
                    <div className="mt-3">
                      {audio?.status === 'done' && audio.audioUrl && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <AudioMiniPlayer src={audio.audioUrl} title={`Card ${i + 1}: ${card.front.slice(0, 50)}`} />
                          </div>
                          <DownloadButton cardId={cardId} />
                        </div>
                      )}

                      {audio?.status === 'rendering' && (
                        <div className="flex items-center gap-2 text-sm text-[#7B5CFF] bg-[#7B5CFF]/10 pixel-border-sm px-4 py-2.5">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Generating audio (Dialogue + TTS + FFmpeg)...
                        </div>
                      )}

                      {audio?.status === 'error' && (
                        <div className="flex items-center justify-between text-sm bg-[#FF6B8A]/10 pixel-border-sm px-4 py-2.5">
                          <span className="text-[#FF6B8A]">Audio failed: {audio.error}</span>
                          <button
                            onClick={() => renderAudioForCard(card, cardId)}
                            className="text-[#FF6B8A] hover:text-white font-medium ml-2"
                          >
                            Retry
                          </button>
                        </div>
                      )}

                      {!audio && (
                        <button
                          onClick={() => renderAudioForCard(card, cardId)}
                          className="flex items-center gap-2 text-sm text-[#6B7A99] hover:text-[#7B5CFF] bg-[#2A3352]/50 hover:bg-[#7B5CFF]/10 pixel-border-sm px-4 py-2.5 transition-pixel w-full"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3" />
                          </svg>
                          Generate audio for this card
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
