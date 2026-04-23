import { NextRequest, NextResponse } from 'next/server';
import { generateFlashcards } from '@/lib/ai/flashcard-generator';
import { factCheckFlashcards } from '@/lib/ai/fact-checker';
import { extractDocumentText } from '@/lib/ai/document-extractor';
import { researchFromDocument } from '@/lib/ai/research-agent';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const language = (formData.get('language') as string) || 'en';
    const depth = (formData.get('depth') as string) || 'standard';

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Step 1: Extract text from document
    const text = await extractDocumentText(file);

    if (text.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract enough text from this document. Try a different file.' },
        { status: 400 },
      );
    }

    // Step 2: Research/structure the document content
    const research = await researchFromDocument({ text, language, depth });

    // Step 3: Generate flashcards from research
    const rawCards = await generateFlashcards(research);

    // Step 4: Fact-check against source document
    const { cards, report } = await factCheckFlashcards(rawCards, research);

    if (report.fixedCount > 0 || report.removedCount > 0) {
      console.log(
        `[Fact-check] document "${file.name}": ${report.fixedCount} fixed, ${report.removedCount} removed out of ${rawCards.length} cards`,
      );
    }

    const deckId = `deck-${Date.now()}`;
    const topic = research.topic || file.name;

    // Generate cover image in background
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
      fileName: file.name,
    });
  } catch (error) {
    console.error('Document research error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Document processing failed' },
      { status: 500 },
    );
  }
}
