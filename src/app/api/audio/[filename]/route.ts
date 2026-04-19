import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import os from 'os';

const AUDIO_DIR = path.join(os.tmpdir(), 'studypod-audio');

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Sanitize filename — only allow alphanumeric, hyphens, dots
  if (!/^[\w\-.]+\.mp3$/.test(filename)) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const filePath = path.join(AUDIO_DIR, filename);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'Audio not found' }, { status: 404 });
  }

  const buffer = readFileSync(filePath);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
