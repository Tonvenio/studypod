export interface DialogueSegment {
  speaker: 'A' | 'B';
  text: string;
}

export interface DialogueScript {
  cardId: string;
  segments: DialogueSegment[];
  estimatedDurationSeconds: number;
}

export interface AudioSegment {
  speaker: 'A' | 'B';
  text: string;
  audioPath: string;
  durationMs: number;
}

export interface TTSConfig {
  language: string;
  voiceA: string;
  voiceB: string;
  speakingRate: number;
}

export interface RenderResult {
  cardId: string;
  audioUrl: string;
  durationSeconds: number;
  transcript: { startMs: number; endMs: number; speaker: string; text: string }[];
}
