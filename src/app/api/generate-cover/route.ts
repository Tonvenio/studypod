import { NextRequest, NextResponse } from 'next/server';
import { GEMINI_IMAGE_API } from '@/lib/ai/gemini-config';

const STYLE_PREFIX = `
Create a pixel-art cover image for a study flashcard deck.

STYLE REQUIREMENTS:
- 16-bit pixel art style, like classic RPG game art
- Dark background color: #0B0E17 (deep navy)
- Color palette: purple (#7B5CFF), green (#00E896), yellow (#FFD93D), pink (#FF6B8A), navy (#0B0E17)
- Simple, iconic composition with 1-2 key objects representing the topic
- Clean pixel grid, no anti-aliasing, crisp edges
- Subtle glow effects around key objects
- NO text, NO letters, NO words in the image
- Square 1:1 aspect ratio, suitable as album/deck cover art
- Retro gaming aesthetic — think Game Boy Advance or SNES style
- Professional but playful — this is for a gamified study app
`.trim();

export async function POST(request: NextRequest) {
  try {
    const { topic, deckId } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 });
    }

    const subjectPrompt = `A pixel-art cover for a study deck about "${topic}". Show 1-2 iconic pixel-art objects that represent this subject in a retro gaming style.`;
    const fullPrompt = `${STYLE_PREFIX}\n\nSUBJECT: ${subjectPrompt}`;

    const res = await fetch(`${GEMINI_IMAGE_API}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: { aspectRatio: '1:1', imageSize: '1K' },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Cover gen error ${res.status}: ${errText.substring(0, 200)}`);
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }

    const data = await res.json();
    let imageBuffer: Buffer | null = null;

    for (const candidate of data.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData) {
          imageBuffer = Buffer.from(part.inlineData.data, 'base64');
          break;
        }
      }
      if (imageBuffer) break;
    }

    if (!imageBuffer) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    // Upload to Supabase Storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let coverUrl: string;

    if (supabaseUrl && serviceKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, serviceKey);

      const storagePath = `${deckId || 'unknown'}.png`;
      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(storagePath, imageBuffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) {
        console.error('Cover upload error:', uploadError);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
      }

      const { data: urlData } = supabase.storage.from('covers').getPublicUrl(storagePath);
      coverUrl = urlData.publicUrl;

      // Update deck record if deckId provided
      if (deckId) {
        await supabase.from('decks').update({ cover_image_url: coverUrl }).eq('id', deckId);
      }
    } else {
      // Return as data URL fallback
      coverUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    }

    return NextResponse.json({ coverUrl });
  } catch (error) {
    console.error('Cover generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cover generation failed' },
      { status: 500 },
    );
  }
}
