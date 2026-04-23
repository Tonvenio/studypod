import { NextRequest, NextResponse } from 'next/server';
import { writeDialogue } from '@/lib/ai/dialogue-writer';
import { renderSegments } from '@/lib/audio/tts-renderer';
import { processAudio } from '@/lib/audio/audio-processor';
import { preprocessForTTS } from '@/lib/audio/pronunciation';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import path from 'path';
import os from 'os';
import { uploadAudio } from '@/lib/audio/storage';

const AUDIO_DIR = path.join(os.tmpdir(), 'studypod-audio');

export async function POST(request: NextRequest) {
  try {
    const { card, language = 'de' } = await request.json();

    if (!card || !card.id || !card.front || !card.back) {
      return NextResponse.json({ error: 'Card with id, front, back required' }, { status: 400 });
    }

    // Ensure output directory exists
    if (!existsSync(AUDIO_DIR)) mkdirSync(AUDIO_DIR, { recursive: true });

    const outputFilename = `card-${card.id}.mp3`;
    const outputPath = path.join(AUDIO_DIR, outputFilename);

    // Check if already rendered
    if (existsSync(outputPath)) {
      return NextResponse.json({
        cardId: card.id,
        audioUrl: `/api/audio/${outputFilename}`,
        cached: true,
      });
    }

    // Step 1: Generate dialogue script via Gemini
    const dialogues = await writeDialogue(
      [{ id: card.id, front: card.front, back: card.back, explanation: card.explanation || '' }],
      language
    );

    if (!dialogues.length || !dialogues[0].segments.length) {
      throw new Error('Dialogue generation returned empty result');
    }

    const dialogue = dialogues[0];

    // Step 2: Preprocess text for TTS
    const preprocessedSegments = dialogue.segments.map((seg) => ({
      ...seg,
      text: seg.text === '[pause]' ? '[pause]' : preprocessForTTS(seg.text, language),
    }));

    // Step 3: Render each segment via hybrid TTS (Edge + Google Cloud)
    const renderedSegments = await renderSegments({
      segments: preprocessedSegments,
      language,
      jobId: card.id,
    });

    // Step 4: Concatenate + normalize via FFmpeg
    const result = await processAudio({
      segments: renderedSegments,
      outputPath,
      silenceBetweenMs: 150,
    });

    // Upload to Supabase Storage and update flashcard record
    let audioUrl = `/api/audio/${outputFilename}`;
    try {
      const buffer = readFileSync(outputPath);
      const storagePath = `${card.deckId || 'anonymous'}/${card.id}.mp3`;
      const uploaded = await uploadAudio(buffer, storagePath);
      audioUrl = uploaded.publicUrl;

      // Update flashcard audio_url in database
      if (card.flashcardDbId) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && serviceKey) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, serviceKey);
          await supabase.from('flashcards')
            .update({ audio_url: audioUrl, audio_storage_path: storagePath })
            .eq('id', card.flashcardDbId);
        }
      }
    } catch (err) {
      console.error('Audio upload error (falling back to local):', err);
    }

    return NextResponse.json({
      cardId: card.id,
      audioUrl,
      durationSeconds: result.durationSeconds,
      transcript: result.transcript,
    });
  } catch (error) {
    console.error('Audio render error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Audio rendering failed' },
      { status: 500 }
    );
  }
}
