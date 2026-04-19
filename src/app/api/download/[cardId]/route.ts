import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import os from 'os';

const AUDIO_DIR = path.join(os.tmpdir(), 'studypod-audio');

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;

  // Sanitize
  if (!/^[\w\-.]+$/.test(cardId)) {
    return NextResponse.json({ error: 'Invalid card ID' }, { status: 400 });
  }

  // Try to find the audio file
  const filename = `card-${cardId}.mp3`;
  const filePath = path.join(AUDIO_DIR, filename);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'Audio not found' }, { status: 404 });
  }

  const buffer = readFileSync(filePath);
  const safeName = `studypod-${cardId}.mp3`.replace(/[^a-zA-Z0-9\-_.]/g, '-');

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Content-Length': buffer.length.toString(),
    },
  });
}
