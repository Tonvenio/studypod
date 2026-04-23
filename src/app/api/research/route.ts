import { NextRequest, NextResponse } from 'next/server';
import { researchTopic } from '@/lib/ai/research-agent';
import { generateFlashcards } from '@/lib/ai/flashcard-generator';
import { factCheckFlashcards } from '@/lib/ai/fact-checker';
import { createClient } from '@/lib/supabase/server';
import { getUserSubscription, incrementUsage } from '@/lib/billing/subscription';

export async function POST(request: NextRequest) {
  try {
    const { topic, language = 'en', depth = 'standard' } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }

    if (topic.length > 500) {
      return NextResponse.json({ error: 'Topic too long (max 500 characters)' }, { status: 400 });
    }

    // Check subscription limits (if logged in)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const sub = await getUserSubscription(user.id);
      if (!sub.canCreateDeck) {
        return NextResponse.json({
          error: `You've reached the free limit of ${sub.limits.decksPerMonth} decks/month. Upgrade to Pro for unlimited decks.`,
          upgradeRequired: true,
        }, { status: 403 });
      }
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

    const deckId = `deck-${Date.now()}`;

    // Track usage
    if (user) {
      await incrementUsage(user.id, 'decks_created').catch(() => {});
    }

    // Generate cover image in background (don't block response)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3011';
    fetch(`${appUrl}/api/generate-cover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, deckId }),
    }).catch((err) => console.error('Cover gen fire-and-forget error:', err));

    return NextResponse.json({
      research,
      cards,
      factCheck: {
        total: rawCards.length,
        passed: cards.length,
        fixed: report.fixedCount,
        removed: report.removedCount,
      },
      deckId,
    });
  } catch (error) {
    console.error('Research error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Research failed' },
      { status: 500 }
    );
  }
}
