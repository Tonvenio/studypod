import { renderEdgeTTS, getEdgeVoice } from './edge-tts';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import os from 'os';

interface DialogueSegment {
  speaker: 'A' | 'B';
  text: string;
}

interface RenderedSegment {
  speaker: 'A' | 'B';
  text: string;
  audioPath: string;
  durationMs: number;
}

interface TTSOptions {
  segments: DialogueSegment[];
  language?: string;
  outputDir?: string;
  jobId?: string;
}

const GOOGLE_TTS_API = 'https://texttospeech.googleapis.com/v1beta1/text:synthesize';

const GOOGLE_VOICES: Record<string, string> = {
  en: 'en-US-Chirp3-HD-Orus',
  de: 'de-DE-Chirp3-HD-Orus',
  es: 'es-ES-Chirp3-HD-Orus',
  fr: 'fr-FR-Chirp3-HD-Orus',
};

export async function renderSegments(options: TTSOptions): Promise<RenderedSegment[]> {
  const { segments, language = 'en', jobId = Date.now().toString() } = options;
  const outputDir = options.outputDir || path.join(os.tmpdir(), `studypod-tts-${jobId}`);

  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const results: RenderedSegment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    // Handle pause segments
    if (seg.text === '[pause]') {
      results.push({
        speaker: seg.speaker,
        text: '[pause]',
        audioPath: '', // Will be generated as silence in audio-processor
        durationMs: 2000,
      });
      continue;
    }

    const outputPath = path.join(outputDir, `segment-${String(i).padStart(3, '0')}-${seg.speaker}.mp3`);

    if (seg.speaker === 'A') {
      // Female voice via Edge TTS
      await renderEdgeTTS({
        text: seg.text,
        voice: getEdgeVoice(language),
        rate: '-5%',
        outputPath,
      });
    } else {
      // Male voice via Google Cloud TTS
      await renderGoogleTTS({
        text: seg.text,
        voice: GOOGLE_VOICES[language] || GOOGLE_VOICES.en,
        language,
        outputPath,
      });
    }

    // Get duration via ffprobe
    const durationMs = getAudioDuration(outputPath);

    results.push({
      speaker: seg.speaker,
      text: seg.text,
      audioPath: outputPath,
      durationMs,
    });
  }

  return results;
}

async function renderGoogleTTS(options: {
  text: string;
  voice: string;
  language: string;
  outputPath: string;
}): Promise<void> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY is required for Google Cloud TTS');

  const langCode = options.language === 'de' ? 'de-DE' : options.language === 'es' ? 'es-ES' : options.language === 'fr' ? 'fr-FR' : 'en-US';

  const response = await fetch(`${GOOGLE_TTS_API}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text: options.text },
      voice: { languageCode: langCode, name: options.voice },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.02,
        sampleRateHertz: 24000,
        effectsProfileId: ['headphone-class-device'],
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google TTS error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const audioContent = data.audioContent;
  if (!audioContent) throw new Error('No audio content in Google TTS response');

  writeFileSync(options.outputPath, Buffer.from(audioContent, 'base64'));
}

function getAudioDuration(filePath: string): number {
  try {
    const output = execSync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { encoding: 'utf-8' }
    ).trim();
    return Math.round(parseFloat(output) * 1000);
  } catch {
    return 3000; // Fallback 3s estimate
  }
}
