import { NextRequest, NextResponse } from 'next/server';
import { buildAnkiNotes } from '@/lib/anki/deck-builder';
import { generateApkg } from '@/lib/anki/apkg-export';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const deckId = request.nextUrl.searchParams.get('deckId');

  if (!deckId) {
    return NextResponse.json({ error: 'deckId is required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Fetch deck
    const { data: deck } = await supabase
      .from('decks')
      .select('topic')
      .eq('id', deckId)
      .single();

    // Fetch cards
    const { data: flashcards } = await supabase
      .from('flashcards')
      .select('front, back, explanation, audio_url, difficulty')
      .eq('deck_id', deckId)
      .order('order_index', { ascending: true });

    const cards = (flashcards || []).map((c) => ({
      front: c.front,
      back: c.back,
      explanation: c.explanation || '',
      audioUrl: c.audio_url,
      difficulty: c.difficulty || 3,
    }));

    if (cards.length === 0) {
      return NextResponse.json({ error: 'No cards found for this deck' }, { status: 404 });
    }

    const topic = deck?.topic || 'Unknown Topic';
    const slug = topic.toLowerCase().replace(/\s+/g, '-');
    const notes = buildAnkiNotes(cards, topic);
    const apkgBuffer = await generateApkg({
      deckName: `studypod - ${topic}`,
      notes,
    });

    return new NextResponse(new Uint8Array(apkgBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="studypod-${slug}.apkg"`,
      },
    });
  } catch (error) {
    console.error('Anki export error:', error);
    return NextResponse.json({ error: 'Failed to generate Anki deck' }, { status: 500 });
  }
}
