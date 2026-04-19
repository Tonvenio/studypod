import { NextRequest, NextResponse } from 'next/server';
import { researchTopic } from '@/lib/ai/research-agent';
import { generateFlashcards } from '@/lib/ai/flashcard-generator';
import { factCheckFlashcards } from '@/lib/ai/fact-checker';

export async function POST(request: NextRequest) {
  try {
    const { topic, language = 'en', depth = 'standard' } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }

    // Step 1: Research the topic
    const research = await researchTopic({ topic, language, depth });

    // Step 2: Generate flashcards from research
    const rawCards = await generateFlashcards(research);

    // Step 3: Fact-check flashcards against source research
    const { cards, report } = await factCheckFlashcards(rawCards, research);

    if (report.fixedCount > 0 || report.removedCount > 0) {
      console.log(`[Fact-check] ${topic}: ${report.fixedCount} fixed, ${report.removedCount} removed out of ${rawCards.length} cards`);
    }

    return NextResponse.json({
      research,
      cards,
      factCheck: {
        total: rawCards.length,
        passed: cards.length,
        fixed: report.fixedCount,
        removed: report.removedCount,
      },
      deckId: `deck-${Date.now()}`,
    });
  } catch (error) {
    console.error('Research error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Research failed' },
      { status: 500 }
    );
  }
}
