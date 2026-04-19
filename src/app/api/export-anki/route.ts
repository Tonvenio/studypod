import { NextRequest, NextResponse } from 'next/server';
import { buildAnkiNotes } from '@/lib/anki/deck-builder';
import { generateApkg } from '@/lib/anki/apkg-export';

export async function GET(request: NextRequest) {
  const deckId = request.nextUrl.searchParams.get('deckId');

  if (!deckId) {
    return NextResponse.json({ error: 'deckId is required' }, { status: 400 });
  }

  try {
    // TODO: Fetch deck and cards from Supabase when connected
    const mockCards = [
      {
        front: 'What is photosynthesis?',
        back: 'The process by which plants convert light energy into chemical energy (glucose), using carbon dioxide and water.',
        explanation: '6CO2 + 6H2O + light → C6H12O6 + 6O2',
        audioUrl: null,
        difficulty: 2,
      },
    ];

    const notes = buildAnkiNotes(mockCards, 'sample-topic');
    const apkgBuffer = await generateApkg({
      deckName: `studypod - Sample Topic`,
      notes,
    });

    return new NextResponse(new Uint8Array(apkgBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="studypod-sample.apkg"`,
      },
    });
  } catch (error) {
    console.error('Anki export error:', error);
    return NextResponse.json({ error: 'Failed to generate Anki deck' }, { status: 500 });
  }
}
