const STORAGE_KEY = 'studypod-decks';

interface SavedDeck {
  id: string;
  topic: string;
  description: string;
  language: string;
  cards: {
    front: string;
    back: string;
    explanation: string;
    difficulty: 1 | 2 | 3 | 4 | 5;
    audioUrl: string | null;
  }[];
  createdAt: string;
}

/** Save a deck locally (guest mode) */
export function saveLocalDeck(deck: SavedDeck): void {
  const existing = getLocalDecks();
  const updated = [deck, ...existing.filter((d) => d.id !== deck.id)].slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/** Get all locally saved decks */
export function getLocalDecks(): SavedDeck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Get a single local deck by ID */
export function getLocalDeck(id: string): SavedDeck | null {
  return getLocalDecks().find((d) => d.id === id) || null;
}

/** Delete a local deck */
export function deleteLocalDeck(id: string): void {
  const existing = getLocalDecks();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.filter((d) => d.id !== id)));
}

/** Save deck to Supabase (logged-in users). Returns the real DB deck ID (UUID). */
export async function saveRemoteDeck(deck: SavedDeck): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const { createBrowserClient } = await import('@supabase/ssr');
    const supabase = createBrowserClient(supabaseUrl, supabaseKey);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Ensure profile exists (created on signup via trigger or manually)
    await supabase.from('profiles').upsert({
      id: user.id,
      username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
    }, { onConflict: 'id', ignoreDuplicates: true });

    // Insert deck (let DB generate UUID)
    const { data: deckData, error: deckError } = await supabase
      .from('decks')
      .insert({
        user_id: user.id,
        topic: deck.topic,
        description: deck.description,
        language: deck.language,
        card_count: deck.cards.length,
        status: 'ready',
      })
      .select('id')
      .single();

    if (deckError || !deckData) {
      console.error('Deck save error:', deckError);
      throw new Error(`Failed to save deck: ${deckError?.message || 'unknown error'}`);
    }

    // Bulk insert cards
    const cardRows = deck.cards.map((card, i) => ({
      deck_id: deckData.id,
      front: card.front,
      back: card.back,
      explanation: card.explanation,
      difficulty: card.difficulty,
      audio_url: card.audioUrl,
      order_index: i,
    }));

    const { error: cardsError } = await supabase.from('flashcards').insert(cardRows);
    if (cardsError) {
      console.error('Cards save error:', cardsError);
    }

    // Update profile deck count
    const { count } = await supabase
      .from('decks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if (count !== null) {
      await supabase.from('profiles').update({ total_decks_created: count }).eq('id', user.id);
    }

    return deckData.id;
  } catch (err) {
    console.error('saveRemoteDeck error:', err);
    return null;
  }
}

export type { SavedDeck };
