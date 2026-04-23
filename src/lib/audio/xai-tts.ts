import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

interface XaiTTSOptions {
  text: string;
  voice?: string;
  language?: string;
  outputPath: string;
}

const XAI_VOICES = {
  A: 'ara',   // Warm, friendly — conversational host
  B: 'rex',   // Confident, clear — knowledgeable co-host
} as const;

export function getXaiVoice(speaker: 'A' | 'B'): string {
  return XAI_VOICES[speaker];
}

export async function renderXaiTTS(options: XaiTTSOptions): Promise<string> {
  const { text, voice = 'ara', language = 'en', outputPath } = options;

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error('XAI_API_KEY is required for x.ai TTS');

  const dir = path.dirname(outputPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const response = await fetch('https://api.x.ai/v1/tts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voice_id: voice,
      language: language === 'de' ? 'de' : language === 'es' ? 'es' : language === 'fr' ? 'fr' : 'en',
      output_format: {
        codec: 'mp3',
        sample_rate: 24000,
        bit_rate: 128000,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`x.ai TTS error (${response.status}): ${err}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(outputPath, buffer);

  return outputPath;
}
