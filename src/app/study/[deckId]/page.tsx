'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Nav from '@/components/Nav';
import FlashcardPlayer from '@/components/FlashcardPlayer';
import { getLocalDeck } from '@/lib/deck-store';

type Rating = 'again' | 'hard' | 'good' | 'easy';

interface StudyCard {
  id: string;
  front: string;
  back: string;
  explanation: string;
  audioUrl: string | null;
  difficulty: number;
}

export default function StudyPage() {
  const params = useParams();
  const deckId = params.deckId as string;
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deckTopic, setDeckTopic] = useState('');

  useEffect(() => {
    async function loadCards() {
      // Try localStorage first
      const localDeck = getLocalDeck(deckId);
      if (localDeck) {
        setDeckTopic(localDeck.topic);
        setCards(localDeck.cards.map((c, i) => ({
          id: `${deckId}-${i}`,
          front: c.front,
          back: c.back,
          explanation: c.explanation,
          audioUrl: c.audioUrl,
          difficulty: c.difficulty,
        })));
        setLoading(false);
        return;
      }

      // Try Supabase
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const { data: deck } = await supabase
          .from('decks')
          .select('topic')
          .eq('id', deckId)
          .single();

        if (deck) setDeckTopic(deck.topic);

        const { data: flashcards } = await supabase
          .from('flashcards')
          .select('id, front, back, explanation, audio_url, difficulty, order_index')
          .eq('deck_id', deckId)
          .order('order_index', { ascending: true });

        if (flashcards && flashcards.length > 0) {
          setCards(flashcards.map((c) => ({
            id: c.id,
            front: c.front,
            back: c.back,
            explanation: c.explanation || '',
            audioUrl: c.audio_url,
            difficulty: c.difficulty || 3,
          })));
        }
      } catch (err) {
        console.error('Failed to load cards:', err);
      }
      setLoading(false);
    }
    loadCards();
  }, [deckId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-fg)] flex items-center justify-center">
        <p className="font-[family-name:var(--font-press-start)] text-xs text-[var(--c-muted)]">LOADING...</p>
      </main>
    );
  }

  if (cards.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-fg)] flex items-center justify-center">
        <div className="text-center px-4">
          <p className="font-[family-name:var(--font-press-start)] text-sm text-[var(--c-xp)] mb-4">NO CARDS FOUND</p>
          <p className="text-[var(--c-muted)] mb-6">This deck doesn&apos;t exist or has no cards.</p>
          <Link href="/" className="pixel-border-sm bg-[var(--c-primary)] text-white px-6 py-3 font-semibold transition-pixel">
            CREATE A DECK
          </Link>
        </div>
      </main>
    );
  }

  const currentCard = cards[currentIndex];

  const handleRate = (rating: Rating) => {
    setRatings((prev) => ({ ...prev, [currentCard.id]: rating }));
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsComplete(true);
    }
  };

  if (isComplete) {
    const correct = Object.values(ratings).filter((r) => r === 'good' || r === 'easy').length;
    return (
      <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-fg)] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="font-[family-name:var(--font-press-start)] text-2xl mb-2 text-[var(--c-xp)]">QUEST COMPLETE!</h1>
          <p className="text-[var(--c-muted)] mb-2">You studied {cards.length} cards</p>
          <div className="pixel-border bg-[var(--c-surface)] p-4 mb-6 inline-block">
            <span className="font-[family-name:var(--font-press-start)] text-lg text-[var(--c-accent)]">{correct}/{cards.length}</span>
            <span className="text-[var(--c-muted)] ml-2 text-sm">cards mastered</span>
          </div>
          <div className="flex gap-3 justify-center">
            <Link
              href={`/review/${deckId}`}
              className="pixel-border-sm bg-[var(--c-primary)] hover:bg-[var(--c-primary-hover)] text-white px-6 py-3 font-semibold transition-pixel"
            >
              Spaced review
            </Link>
            <Link href="/dashboard" className="pixel-border-sm bg-[var(--c-surface)] hover:bg-[var(--c-surface-hover)] border-2 border-[var(--c-border)] text-white px-6 py-3 font-semibold transition-pixel">
              Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-fg)] flex flex-col">
      <Nav rightContent={<>
        {deckTopic && <span className="text-xs text-[var(--c-muted)] hidden sm:block">{deckTopic}</span>}
        <Link href="/dashboard" className="text-xs text-[var(--c-muted)] hover:text-[var(--c-fg)] transition-pixel py-2">Exit</Link>
      </>} />

      <div className="flex-1 flex items-center justify-center px-3 sm:px-4 py-4 sm:py-12">
        <FlashcardPlayer
          front={currentCard.front}
          back={currentCard.back}
          explanation={currentCard.explanation}
          audioUrl={currentCard.audioUrl}
          onRate={handleRate}
          cardNumber={currentIndex + 1}
          totalCards={cards.length}
        />
      </div>
    </main>
  );
}
