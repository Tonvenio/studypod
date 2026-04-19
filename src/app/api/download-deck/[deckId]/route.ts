import { NextRequest, NextResponse } from 'next/server';
import { existsSync, readdirSync, createReadStream } from 'fs';
import path from 'path';
import os from 'os';
import archiver from 'archiver';
import { PassThrough } from 'stream';

const AUDIO_DIR = path.join(os.tmpdir(), 'studypod-audio');

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  const { deckId } = await params;

  if (!/^[\w\-.]+$/.test(deckId)) {
    return NextResponse.json({ error: 'Invalid deck ID' }, { status: 400 });
  }

  // Find all MP3s for this deck (files matching card-{deckId}-*.mp3)
  if (!existsSync(AUDIO_DIR)) {
    return NextResponse.json({ error: 'No audio files found' }, { status: 404 });
  }

  const allFiles = readdirSync(AUDIO_DIR).filter((f) => f.endsWith('.mp3'));
  const deckFiles = allFiles.filter((f) => f.startsWith(`card-${deckId}-`));

  if (deckFiles.length === 0) {
    return NextResponse.json({ error: 'No audio files for this deck' }, { status: 404 });
  }

  // Create ZIP stream
  const archive = archiver('zip', { zlib: { level: 1 } }); // Low compression for MP3s (already compressed)
  const passThrough = new PassThrough();

  archive.pipe(passThrough);

  // Add each MP3 to the archive
  for (const filename of deckFiles.sort()) {
    const filePath = path.join(AUDIO_DIR, filename);
    // Extract card number for friendly naming
    const match = filename.match(/card-[\w-]+-(\d+)\.mp3/);
    const num = match ? String(parseInt(match[1]) + 1).padStart(2, '0') : filename;
    const friendlyName = `${num}-flashcard.mp3`;

    archive.append(createReadStream(filePath), { name: friendlyName });
  }

  archive.finalize();

  // Convert PassThrough to ReadableStream for NextResponse
  const readableStream = new ReadableStream({
    start(controller) {
      passThrough.on('data', (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      passThrough.on('end', () => {
        controller.close();
      });
      passThrough.on('error', (err) => {
        controller.error(err);
      });
    },
  });

  const safeDeckName = deckId.replace(/[^a-zA-Z0-9\-]/g, '-');

  return new NextResponse(readableStream, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="studypod-${safeDeckName}.zip"`,
    },
  });
}
