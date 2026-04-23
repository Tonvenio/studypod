'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { getLocalDeck } from '@/lib/deck-store';

interface DeckCard {
  id: string;
  front: string;
  back: string;
  explanation: string;
  difficulty: number;
  audioUrl: string | null;
}

interface DeckData {
  topic: string;
  description: string;
  cardCount: number;
  coverImageUrl: string | null;
  cards: DeckCard[];
}

export default function DeckPage() {
  const params = useParams();
  const deckId = params.deckId as string;
  const [deck, setDeck] = useState<DeckData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDeck() {
      // Try localStorage
      const local = getLocalDeck(deckId);
      if (local) {
        setDeck({
          topic: local.topic,
          description: local.description,
          cardCount: local.cards.length,
          coverImageUrl: null,
          cards: local.cards.map((c, i) => ({
            id: `${deckId}-${i}`,
            front: c.front,
            back: c.back,
            explanation: c.explanation,
            difficulty: c.difficulty,
            audioUrl: c.audioUrl,
          })),
        });
        setLoading(false);
        return;
      }

      // Try Supabase
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const { data: deckRow } = await supabase
          .from('decks')
          .select('topic, description, card_count, cover_image_url')
          .eq('id', deckId)
          .single();

        const { data: flashcards } = await supabase
          .from('flashcards')
          .select('id, front, back, explanation, difficulty, audio_url')
          .eq('deck_id', deckId)
          .order('order_index', { ascending: true });

        if (deckRow) {
          setDeck({
            topic: deckRow.topic,
            description: deckRow.description || '',
            cardCount: deckRow.card_count,
            coverImageUrl: deckRow.cover_image_url,
            cards: (flashcards || []).map((c) => ({
              id: c.id,
              front: c.front,
              back: c.back,
              explanation: c.explanation || '',
              difficulty: c.difficulty || 3,
              audioUrl: c.audio_url,
            })),
          });
        }
      } catch (err) {
        console.error('Load deck error:', err);
      }
      setLoading(false);
    }
    loadDeck();
  }, [deckId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-fg)] flex items-center justify-center">
        <p className="font-[family-name:var(--font-press-start)] text-xs text-[var(--c-muted)]">LOADING...</p>
      </main>
    );
  }

  if (!deck) {
    return (
      <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-fg)] flex items-center justify-center">
        <div className="text-center px-4">
          <p className="font-[family-name:var(--font-press-start)] text-sm text-[var(--c-xp)] mb-4">DECK NOT FOUND</p>
          <Link href="/" className="pixel-border-sm bg-[var(--c-primary)] text-white px-6 py-3 font-semibold transition-pixel">
            CREATE A DECK
          </Link>
        </div>
      </main>
    );
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
        <Link href="/dashboard" className="text-xs text-[var(--c-muted)] hover:text-[var(--c-fg)] transition-pixel py-2">Dashboard</Link>
      } />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            {deck.coverImageUrl && (
              <img
                src={deck.coverImageUrl}
                alt={deck.topic}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover pixelBorder"
                style={{ imageRendering: 'pixelated' }}
              />
            )}
            <div>
              <h1 className="font-[family-name:var(--font-press-start)] text-lg sm:text-2xl mb-2">{deck.topic}</h1>
              <p className="text-[var(--c-muted)] text-sm">{deck.description}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
            <Link
              href={`/review/${deckId}`}
              className="pixel-border-sm bg-[var(--c-primary)] hover:bg-[var(--c-primary-hover)] text-white px-6 py-3 font-semibold transition-pixel text-center"
            >
              Review ({deck.cardCount} cards)
            </Link>
            <Link
              href={`/study/${deckId}`}
              className="pixel-border-sm bg-[var(--c-surface)] hover:bg-[var(--c-surface-hover)] border border-[var(--c-border)] text-white px-6 py-3 font-semibold transition-pixel text-center"
            >
              Quick Study
            </Link>
          </div>
        </div>

        <h2 className="font-[family-name:var(--font-press-start)] text-xs sm:text-sm mb-4">CARD INVENTORY</h2>
        <div className="grid gap-2 sm:gap-3">
          {deck.cards.map((card, i) => (
            <div key={card.id} className="pixel-border bg-[var(--c-surface)] p-4 sm:p-5 hover:border-[#7B5CFF]/30 transition-pixel">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-[var(--c-muted)]">#{i + 1}</span>
                <span className={`text-xs font-medium px-2 py-0.5 ${difficultyColor(card.difficulty)}`}>
                  {difficultyLabel(card.difficulty)}
                </span>
              </div>
              <p className="font-medium mb-1">{card.front}</p>
              <p className="text-sm text-[var(--c-muted)]">{card.back}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
