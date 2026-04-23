import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const deckId = request.nextUrl.searchParams.get('deckId');
    const now = new Date().toISOString();

    // Get due cards with their flashcard data
    let query = supabase
      .from('card_progress')
      .select(`
        *,
        flashcards!inner (
          id, front, back, explanation, difficulty, deck_id,
          decks!inner ( id, topic, user_id )
        )
      `)
      .eq('user_id', user.id)
      .lte('next_review_at', now)
      .order('next_review_at', { ascending: true });

    if (deckId) {
      query = query.eq('flashcards.deck_id', deckId);
    }

    const { data: dueCards, error } = await query;

    if (error) {
      throw error;
    }

    // Also get new cards (no progress entry yet) for the deck
    let newCards: unknown[] = [];
    if (deckId) {
      // Only fetch cards from decks owned by the current user
      const { data: allCards } = await supabase
        .from('flashcards')
        .select('id, front, back, explanation, difficulty, deck_id, decks!inner(user_id)')
        .eq('deck_id', deckId)
        .eq('decks.user_id', user.id);

      const reviewedIds = new Set((dueCards || []).map((d: { flashcard_id: string }) => d.flashcard_id));

      // Also check non-due cards
      const { data: allProgress } = await supabase
        .from('card_progress')
        .select('flashcard_id')
        .eq('user_id', user.id);

      const allProgressIds = new Set((allProgress || []).map((p: { flashcard_id: string }) => p.flashcard_id));

      newCards = (allCards || [])
        .filter((c: { id: string }) => !reviewedIds.has(c.id) && !allProgressIds.has(c.id))
        .slice(0, 10); // Limit new cards per session
    }

    return NextResponse.json({
      dueCards: (dueCards || []).map((d: Record<string, unknown>) => ({
        progressId: d.id,
        flashcard: d.flashcards,
        masteryTier: d.mastery_tier || 0,
        correctStreak: d.correct_streak || 0,
        totalReviews: d.total_reviews || 0,
        nextReviewAt: d.next_review_at,
        isOverdue: true,
      })),
      newCards: newCards,
      totalDue: (dueCards || []).length,
      totalNew: (newCards || []).length,
    });
  } catch (error) {
    console.error('Due cards error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch due cards' },
      { status: 500 }
    );
  }
}
