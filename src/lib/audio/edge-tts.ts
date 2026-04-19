import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import os from 'os';

interface EdgeTTSOptions {
  text: string;
  voice?: string;
  rate?: string;
  outputPath: string;
}

const DEFAULT_VOICES: Record<string, string> = {
  en: 'en-US-AriaNeural',
  de: 'de-DE-SeraphinaMultilingualNeural',
  es: 'es-ES-ElviraNeural',
  fr: 'fr-FR-DeniseNeural',
};

export async function renderEdgeTTS(options: EdgeTTSOptions): Promise<string> {
  const { text, voice, rate = '-5%', outputPath } = options;
  const selectedVoice = voice || DEFAULT_VOICES.en;

  const dir = path.dirname(outputPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  // Write text to temp file to avoid shell escaping issues
  const tmpTextFile = path.join(os.tmpdir(), `edge-tts-${Date.now()}.txt`);
  writeFileSync(tmpTextFile, text, 'utf-8');

  try {
    // Use edge-tts Python package
    const cmd = `edge-tts --voice "${selectedVoice}" --rate="${rate}" --file "${tmpTextFile}" --write-media "${outputPath}"`;
    execSync(cmd, { stdio: 'pipe', timeout: 60000 });
    return outputPath;
  } finally {
    try { unlinkSync(tmpTextFile); } catch {}
  }
}

export function getEdgeVoice(language: string): string {
  return DEFAULT_VOICES[language] || DEFAULT_VOICES.en;
}
