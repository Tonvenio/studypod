import { NextRequest, NextResponse } from 'next/server';
import { researchTopic } from '@/lib/ai/research-agent';
import { generateFlashcards } from '@/lib/ai/flashcard-generator';

export async function POST(request: NextRequest) {
  try {
    const { topic, language = 'en', depth = 'standard' } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }

    // Step 1: Research the topic
    const research = await researchTopic({ topic, language, depth });

    // Step 2: Generate flashcards from research
    const cards = await generateFlashcards(research);

    return NextResponse.json({
      research,
      cards,
      deckId: `deck-${Date.now()}`, // Placeholder until Supabase persistence
    });
  } catch (error) {
    console.error('Research error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Research failed' },
      { status: 500 }
    );
  }
}
