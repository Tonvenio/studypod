import type { DialogueScript } from '@/types/audio';

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

interface FlashcardInput {
  id: string;
  front: string;
  back: string;
  explanation: string;
}

const VOICE_NAMES: Record<string, { A: string; B: string }> = {
  en: { A: 'Sarah', B: 'Alex' },
  de: { A: 'Anna', B: 'Felix' },
  es: { A: 'Mía', B: 'Carlos' },
  fr: { A: 'Léa', B: 'Hugo' },
};

export async function writeDialogue(
  cards: FlashcardInput[],
  language: string = 'en'
): Promise<DialogueScript[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY is required');

  const names = VOICE_NAMES[language] || VOICE_NAMES.en;
  const batchSize = 5;
  const results: DialogueScript[] = [];

  for (let i = 0; i < cards.length; i += batchSize) {
    const batch = cards.slice(i, i + batchSize);
    const batchResults = await generateDialogueBatch(batch, names, language, apiKey);
    results.push(...batchResults);
  }

  return results;
}

async function generateDialogueBatch(
  cards: FlashcardInput[],
  names: { A: string; B: string },
  language: string,
  apiKey: string
): Promise<DialogueScript[]> {
  const langName = language === 'en' ? 'English' : language === 'de' ? 'German' : language;

  const prompt = `You are a podcast script writer creating educational audio flashcards. Write natural, engaging dialogue between two hosts:
- ${names.A} (Speaker A, female): Asks questions, keeps energy up, relates to student life
- ${names.B} (Speaker B, male): Gives clear explanations, uses analogies, drops study tips

For EACH flashcard below, write a short dialogue (60-90 seconds when spoken):

${cards.map((c, i) => `--- CARD ${i + 1} (ID: ${c.id}) ---
Question: ${c.front}
Answer: ${c.back}
Extra context: ${c.explanation}`).join('\n\n')}

Return a JSON array with one entry per card:
[
  {
    "cardId": "the card ID",
    "segments": [
      { "speaker": "A", "text": "${names.A}'s line" },
      { "speaker": "B", "text": "${names.B}'s response" }
    ],
    "estimatedDurationSeconds": 75
  }
]

Dialogue rules:
- ${names.A} opens with the question naturally (not reading it verbatim)
- ${names.B} answers clearly, then adds a memorable tip or analogy
- ${names.A} might react or ask a follow-up
- ${names.B} wraps up with a concise summary
- 4-8 segments per card (alternating speakers)
- Conversational tone — two friends studying together
- Language: ${langName}
- NO filler words ("um", "uh", "like")
- Include a think-pause: { "speaker": "A", "text": "[pause]" } before the answer

Return ONLY valid JSON array, no markdown fences.`;

  const response = await fetch(`${GEMINI_API}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');

  return JSON.parse(text);
}
