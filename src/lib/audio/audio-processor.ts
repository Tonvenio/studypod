import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from 'fs';
import path from 'path';
import os from 'os';

interface RenderedSegment {
  speaker: 'A' | 'B';
  text: string;
  audioPath: string;
  durationMs: number;
}

interface ProcessOptions {
  segments: RenderedSegment[];
  outputPath: string;
  addJingle?: boolean;
  silenceBetweenMs?: number;
}

interface ProcessResult {
  outputPath: string;
  durationSeconds: number;
  transcript: { startMs: number; endMs: number; speaker: string; text: string }[];
}

export async function processAudio(options: ProcessOptions): Promise<ProcessResult> {
  const { segments, outputPath, silenceBetweenMs = 150 } = options;

  const dir = path.dirname(outputPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const tmpDir = path.join(os.tmpdir(), `studypod-proc-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  // Generate silence file for gaps between segments
  const silencePath = path.join(tmpDir, 'silence.mp3');
  execSync(
    `ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t ${silenceBetweenMs / 1000} -q:a 9 "${silencePath}"`,
    { stdio: 'pipe' }
  );

  // Generate 1-second silence for [pause] segments
  const pausePath = path.join(tmpDir, 'pause.mp3');
  execSync(
    `ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 1 -q:a 9 "${pausePath}"`,
    { stdio: 'pipe' }
  );

  // Build concat list
  const concatList: string[] = [];
  const transcript: { startMs: number; endMs: number; speaker: string; text: string }[] = [];
  let currentMs = 0;

  for (const seg of segments) {
    if (seg.text === '[pause]') {
      concatList.push(`file '${pausePath}'`);
      currentMs += 2000;
      continue;
    }

    if (!seg.audioPath || !existsSync(seg.audioPath)) continue;

    // Add segment audio
    concatList.push(`file '${seg.audioPath}'`);

    transcript.push({
      startMs: currentMs,
      endMs: currentMs + seg.durationMs,
      speaker: seg.speaker,
      text: seg.text,
    });

    currentMs += seg.durationMs;

    // Add silence gap
    concatList.push(`file '${silencePath}'`);
    currentMs += silenceBetweenMs;
  }

  // Write concat list
  const concatListPath = path.join(tmpDir, 'concat.txt');
  writeFileSync(concatListPath, concatList.join('\n'), 'utf-8');

  // Concatenate all segments
  const rawPath = path.join(tmpDir, 'raw.mp3');
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${rawPath}"`,
    { stdio: 'pipe' }
  );

  // Normalize loudness + add fade in/out
  execSync(
    `ffmpeg -y -i "${rawPath}" -af "loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.5,afade=t=out:st=${(currentMs - 500) / 1000}:d=0.5" -ar 24000 -ac 1 -b:a 128k "${outputPath}"`,
    { stdio: 'pipe' }
  );

  // Get final duration
  const durationOutput = execSync(
    `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${outputPath}"`,
    { encoding: 'utf-8' }
  ).trim();
  const durationSeconds = Math.round(parseFloat(durationOutput));

  // Cleanup temp files
  try {
    for (const f of readdirSync(tmpDir)) unlinkSync(path.join(tmpDir, f));
  } catch {}

  return { outputPath, durationSeconds, transcript };
}
