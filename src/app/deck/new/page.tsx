'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Nav from '@/components/Nav';
import AudioMiniPlayer from '@/components/AudioMiniPlayer';
import DownloadButton from '@/components/DownloadButton';
import DownloadAllButton from '@/components/DownloadAllButton';
import PodcastSubscribe from '@/components/PodcastSubscribe';
import { saveLocalDeck, saveRemoteDeck } from '@/lib/deck-store';

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

function getAutoRenderCount(): number {
  try {
    const raw = localStorage.getItem('studypod-settings');
    if (raw) {
      const s = JSON.parse(raw);
      if (s.autoRenderAudio === false) return 0;
      return s.autoRenderCount || 2;
    }
  } catch {}
  return 2;
}

export default function NewDeckPageWrapper() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-fg)] flex items-center justify-center">
        <div className="text-[var(--c-muted)]">Loading...</div>
      </main>
    }>
      <NewDeckPage />
    </Suspense>
  );
}

function NewDeckPage() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get('topic') || '';
  const initialMode = searchParams.get('mode') === 'upload' ? 'upload' : 'topic';

  const [mode, setMode] = useState<'topic' | 'upload'>(initialMode);
  const [topic, setTopic] = useState(initialTopic);
  const [stage, setStage] = useState<Stage>(initialTopic ? 'researching' : 'input');
  const [progress, setProgress] = useState(0);
  const [cards, setCards] = useState<GeneratedCard[]>([]);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [deckId, setDeckId] = useState(`deck-${Date.now()}`);
  const [factCheck, setFactCheck] = useState<{ total: number; passed: number; fixed: number; removed: number } | null>(null);
  const [audioStates, setAudioStates] = useState<Record<string, AudioState>>({});
  const [renderingCount, setRenderingCount] = useState(0);
  const autoRenderStarted = useRef(false);
  const [remoteDeckId, setRemoteDeckId] = useState<string | null>(null);
  const [dbCardIds, setDbCardIds] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user's language preference
  const getUserLanguage = () => {
    try {
      const raw = localStorage.getItem('studypod-settings');
      if (raw) return JSON.parse(raw).language || 'en';
    } catch {}
    return 'en';
  };

  // Auto-start research if topic was provided via URL, or pick up pending upload
  useEffect(() => {
    if (initialTopic) {
      startResearch(initialTopic);
    } else if (searchParams.get('pending') === 'true') {
      // Pick up file from in-memory store (set by HeroInput)
      import('@/components/HeroInput').then(({ getPendingFile }) => {
        const file = getPendingFile();
        if (file) {
          setMode('upload');
          startDocumentResearch(file);
        }
      });
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
          card: {
            id: cardId,
            front: card.front,
            back: card.back,
            explanation: card.explanation,
            deckId: remoteDeckId || undefined,
            flashcardDbId: dbCardIds[parseInt(cardId.split('-').pop() || '0')] || undefined,
          },
          language: getUserLanguage(),
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
  }, [remoteDeckId, dbCardIds]);

  // Auto-render audio for first N cards once flashcards are ready
  useEffect(() => {
    if (stage === 'done' && cards.length > 0 && !autoRenderStarted.current) {
      autoRenderStarted.current = true;
      const toRender = cards.slice(0, getAutoRenderCount());
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
        body: JSON.stringify({ topic: searchTopic, language: getUserLanguage(), depth: 'standard' }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errData = await response.json();
        if (errData.upgradeRequired) {
          setError(errData.error + ' ');
          setStage('error');
          return;
        }
        throw new Error(errData.error || `Request failed (${response.status})`);
      }

      setProgress(90);
      setStage('generating');

      const data = await response.json();
      const generatedCards = data.cards || [];
      setCards(generatedCards);
      setSummary(data.research?.summary || '');
      if (data.factCheck) setFactCheck(data.factCheck);
      setProgress(100);
      setStage('done');

      // Save deck
      const deckData = {
        id: deckId,
        topic: searchTopic,
        description: data.research?.summary || '',
        language: getUserLanguage(),
        cards: generatedCards.map((c: GeneratedCard) => ({
          front: c.front, back: c.back, explanation: c.explanation,
          difficulty: c.difficulty, audioUrl: null,
        })),
        createdAt: new Date().toISOString(),
      };
      try { saveLocalDeck(deckData); } catch {}

      // Save to Supabase for logged-in users
      try {
        const remoteId = await saveRemoteDeck(deckData);
        if (remoteId) {
          setDeckId(remoteId);
          setRemoteDeckId(remoteId);
          // Fetch DB flashcard IDs for audio persistence
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { data: dbCards } = await supabase
            .from('flashcards')
            .select('id')
            .eq('deck_id', remoteId)
            .order('order_index', { ascending: true });
          if (dbCards) setDbCardIds(dbCards.map((c: { id: string }) => c.id));
        }
      } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStage('error');
    }
  }

  async function startDocumentResearch(file: File) {
    setFileName(file.name);
    setTopic(file.name.replace(/\.[^.]+$/, ''));
    setStage('researching');
    setProgress(10);
    setError('');

    try {
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + Math.random() * 6, 85));
      }, 600);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', getUserLanguage());
      formData.append('depth', 'standard');

      const response = await fetch('/api/research-document', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      setProgress(90);
      setStage('generating');

      const data = await response.json();
      const generatedCards = data.cards || [];
      setCards(generatedCards);
      setTopic(data.research?.topic || file.name);
      setSummary(data.research?.summary || '');
      if (data.factCheck) setFactCheck(data.factCheck);
      setProgress(100);
      setStage('done');

      const deckData = {
        id: deckId,
        topic: data.research?.topic || file.name,
        description: data.research?.summary || '',
        language: getUserLanguage(),
        cards: generatedCards.map((c: GeneratedCard) => ({
          front: c.front, back: c.back, explanation: c.explanation,
          difficulty: c.difficulty, audioUrl: null,
        })),
        createdAt: new Date().toISOString(),
      };
      try { saveLocalDeck(deckData); } catch {}
      try {
        const remoteId = await saveRemoteDeck(deckData);
        if (remoteId) {
          setDeckId(remoteId);
          setRemoteDeckId(remoteId);
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { data: dbCards } = await supabase
            .from('flashcards')
            .select('id')
            .eq('deck_id', remoteId)
            .order('order_index', { ascending: true });
          if (dbCards) setDbCardIds(dbCards.map((c: { id: string }) => c.id));
        }
      } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStage('error');
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) startDocumentResearch(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    startResearch(topic.trim());
  }

  const difficultyColor = (d: number) => {
    if (d <= 2) return 'bg-[var(--c-accent)]/20 text-[var(--c-accent)]';
    if (d <= 3) return 'bg-[var(--c-xp)]/20 text-[var(--c-xp)]';
    return 'bg-[var(--c-danger)]/20 text-[var(--c-danger)]';
  };

  const difficultyLabel = (d: number) =>
    ['', 'Basic', 'Easy', 'Medium', 'Hard', 'Expert'][d] || 'Medium';

  return (
    <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-fg)]">
      <Nav rightContent={
        <Link href="/" className="text-xs text-[var(--c-muted)] hover:text-[var(--c-fg)] transition-pixel py-2">Home</Link>
      } />

      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        {/* Input stage */}
        {stage === 'input' && (
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Create a new deck</h1>

            {/* Mode tabs */}
            <div className="flex justify-center gap-1 mb-8">
              <button
                onClick={() => setMode('topic')}
                className={`font-[family-name:var(--font-press-start)] text-[10px] px-5 py-3 pixel-border-sm transition-pixel ${
                  mode === 'topic'
                    ? 'bg-[var(--c-primary)] text-white'
                    : 'bg-[var(--c-surface)] text-[var(--c-muted)] hover:text-white'
                }`}
              >
                TOPIC
              </button>
              <button
                onClick={() => setMode('upload')}
                className={`font-[family-name:var(--font-press-start)] text-[10px] px-5 py-3 pixel-border-sm transition-pixel ${
                  mode === 'upload'
                    ? 'bg-[var(--c-primary)] text-white'
                    : 'bg-[var(--c-surface)] text-[var(--c-muted)] hover:text-white'
                }`}
              >
                UPLOAD
              </button>
            </div>

            {mode === 'topic' && (
              <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter a study topic..."
                    className="w-full bg-[var(--c-surface)] border border-[var(--c-border)] pixel-border px-6 py-4 pr-32 text-lg text-white placeholder:text-[var(--c-muted)] focus:outline-none focus:ring-2 focus:ring-[#7B5CFF]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!topic.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--c-primary)] hover:bg-[var(--c-primary-hover)] disabled:opacity-50 text-white pixel-border-sm px-5 py-2.5 font-semibold transition-pixel"
                  >
                    Generate
                  </button>
                </div>
              </form>
            )}

            {mode === 'upload' && (
              <div className="max-w-xl mx-auto">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full pixel-border bg-[var(--c-surface)] border border-[var(--c-border)] border-dashed hover:border-[var(--c-primary)] hover:bg-[var(--c-primary)]/5 transition-pixel px-6 py-10 group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-10 h-10 text-[var(--c-muted)] group-hover:text-[var(--c-primary)] transition-pixel" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-[var(--c-muted)] group-hover:text-[var(--c-fg)] font-medium transition-pixel">
                      Drop a file or click to browse
                    </span>
                    <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)]">
                      PDF &bull; TXT &bull; MARKDOWN &bull; CSV
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Research / Generating stage */}
        {(stage === 'researching' || stage === 'generating') && (
          <div className="text-center py-16">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20  bg-[var(--c-primary)]/10 mb-6">
                <svg className="w-10 h-10 text-[var(--c-primary)] animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {stage === 'researching' ? 'Researching your topic...' : 'Generating flashcards...'}
              </h2>
              <p className="text-[var(--c-muted)] mb-1">
                <span className="font-medium text-white">{fileName || topic}</span>
              </p>
              <p className="text-sm text-[var(--c-muted)]">
                {stage === 'researching'
                  ? fileName
                    ? 'Extracting text and analyzing your document...'
                    : 'Our AI is deep-diving into the topic and extracting key concepts.'
                  : 'Structuring Q&A pairs and writing dialogue scripts.'}
              </p>
            </div>
            <div className="max-w-md mx-auto">
              <div className="h-2 bg-[var(--c-border)]  overflow-hidden">
                <div
                  className="h-full bg-[var(--c-primary)]  transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-[var(--c-muted)] mt-2">{Math.round(progress)}%</p>
            </div>
          </div>
        )}

        {/* Error stage */}
        {stage === 'error' && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20  bg-[var(--c-danger)]/10 mb-6">
              <span className="text-4xl">!</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {error.includes('Upgrade') ? 'Limit Reached' : 'Something went wrong'}
            </h2>
            <p className="text-[var(--c-danger)] mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {error.includes('Upgrade') ? (
                <Link
                  href="/pricing"
                  className="bg-[var(--c-accent)] hover:bg-[var(--c-accent-hover)] text-[var(--c-bg)] pixel-border-sm px-6 py-3 font-semibold transition-pixel text-center"
                >
                  Upgrade to Pro
                </Link>
              ) : (
                <button
                  onClick={() => startResearch(topic)}
                  className="bg-[var(--c-primary)] hover:bg-[var(--c-primary-hover)] text-white pixel-border-sm px-6 py-3 font-semibold transition-pixel"
                >
                  Try again
                </button>
              )}
              <button
                onClick={() => { setStage('input'); setError(''); setFileName(''); }}
                className="bg-[var(--c-surface)] hover:bg-[var(--c-border)] border border-[var(--c-border)] text-white pixel-border-sm px-6 py-3 font-semibold transition-pixel"
              >
                Start over
              </button>
            </div>
          </div>
        )}

        {/* Done stage — show generated cards with audio */}
        {stage === 'done' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">{topic}</h1>
              {summary && <p className="text-[var(--c-muted)] mb-4">{summary}</p>}

              {/* Fact-check badge */}
              {factCheck && (
                <div className="pixel-border-sm bg-[var(--c-accent)]/10 px-4 py-2 mb-4 inline-flex items-center gap-2">
                  <span className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-accent)]">
                    VERIFIED
                  </span>
                  <span className="text-xs text-[var(--c-muted)]">
                    {factCheck.passed}/{factCheck.total} cards passed
                    {factCheck.fixed > 0 && ` · ${factCheck.fixed} corrected`}
                    {factCheck.removed > 0 && ` · ${factCheck.removed} removed`}
                  </span>
                </div>
              )}

              {/* Audio rendering status banner */}
              {renderingCount > 0 && (
                <div className="flex items-center gap-3 bg-[var(--c-primary)]/10 border border-[#7B5CFF]/30 pixel-border-sm px-4 py-3 mb-4">
                  <svg className="w-5 h-5 text-[var(--c-primary)] animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm text-[var(--c-primary)]">
                    Rendering audio ({renderingCount} card{renderingCount > 1 ? 's' : ''})... Dialogue + TTS + FFmpeg
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                <Link
                  href={`/review/${deckId}`}
                  className="bg-[var(--c-primary)] hover:bg-[var(--c-primary-hover)] text-white pixel-border-sm px-6 py-3 font-semibold transition-pixel"
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
                  className="flex items-center gap-2 bg-[var(--c-accent)] hover:bg-[var(--c-accent-hover)] text-white pixel-border-sm px-5 py-3 font-semibold transition-pixel"
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
              <PodcastSubscribe feedUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/feed/${deckId}`} />
            </div>

            <h2 className="text-xl font-semibold mb-4">Generated cards</h2>
            <div className="grid gap-3">
              {cards.map((card, i) => {
                const cardId = `${deckId}-${i}`;
                const audio = audioStates[cardId];

                return (
                  <div key={i} className="bg-[var(--c-surface)] border border-[var(--c-border)] pixel-border p-5 hover:border-[#7B5CFF]/30 transition-pixel">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-[var(--c-muted)]">#{i + 1}</span>
                      <span className={`text-xs font-medium px-2 py-0.5  ${difficultyColor(card.difficulty)}`}>
                        {difficultyLabel(card.difficulty)}
                      </span>
                      {audio?.status === 'done' && audio.durationSeconds && (
                        <span className="text-xs text-[var(--c-accent)]">
                          {Math.floor(audio.durationSeconds / 60)}:{String(audio.durationSeconds % 60).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    <p className="font-medium mb-1">{card.front}</p>
                    <p className="text-sm text-[var(--c-muted)]">{card.back}</p>
                    {card.explanation && (
                      <p className="text-xs text-[var(--c-muted)]/70 mt-2 border-t border-[var(--c-border)] pt-2">{card.explanation}</p>
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
                        <div className="flex items-center gap-2 text-sm text-[var(--c-primary)] bg-[var(--c-primary)]/10 pixel-border-sm px-4 py-2.5">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Generating audio (Dialogue + TTS + FFmpeg)...
                        </div>
                      )}

                      {audio?.status === 'error' && (
                        <div className="flex items-center justify-between text-sm bg-[var(--c-danger)]/10 pixel-border-sm px-4 py-2.5">
                          <span className="text-[var(--c-danger)]">Audio failed: {audio.error}</span>
                          <button
                            onClick={() => renderAudioForCard(card, cardId)}
                            className="text-[var(--c-danger)] hover:text-white font-medium ml-2 px-3 py-2"
                          >
                            Retry
                          </button>
                        </div>
                      )}

                      {!audio && (
                        <button
                          onClick={() => renderAudioForCard(card, cardId)}
                          className="flex items-center gap-2 text-sm text-[var(--c-muted)] hover:text-[var(--c-primary)] bg-[var(--c-border)]/50 hover:bg-[var(--c-primary)]/10 pixel-border-sm px-4 py-2.5 transition-pixel w-full"
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
