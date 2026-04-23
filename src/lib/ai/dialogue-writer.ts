import type { DialogueScript } from '@/types/audio';
import { GEMINI_TEXT_API, parseGeminiJSON } from './gemini-config';

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

/**
 * 20 conversation templates that shape HOW the two hosts discuss a flashcard.
 * Each template defines: who opens, the conversation dynamic, and the energy/tone.
 * Templates are assigned to cards in a non-repeating sequence for variety.
 */
const CONVERSATION_TEMPLATES = [
  // === GROUP 1: A leads (classic but varied) ===
  {
    id: 'quiz-challenge',
    instruction: `{A} challenges {B} with the question as a pop quiz. {B} thinks aloud, considers wrong answers first, then arrives at the correct one. {A} confirms and adds a memory trick.`,
  },
  {
    id: 'curious-student',
    instruction: `{A} brings up the topic because something confused them in class. {B} explains patiently using a real-world analogy. {A} has an "aha!" moment and rephrases it in their own words.`,
  },
  {
    id: 'debate-opener',
    instruction: `{A} opens with a deliberately wrong or controversial take on the topic. {B} corrects them with the right answer, explaining why the wrong take is common. They laugh about the misconception.`,
  },
  {
    id: 'exam-panic',
    instruction: `{A} is stressed about an upcoming exam and frantically asks about this topic. {B} calms them down and breaks the answer into simple, memorable steps. {A} feels relieved and repeats the key points.`,
  },
  {
    id: 'storyteller-a',
    instruction: `{A} tells a short anecdote or news story related to the topic, then asks {B} to explain the underlying concept. {B} connects the story to the theory. {A} summarizes the connection.`,
  },

  // === GROUP 2: B leads (role reversal) ===
  {
    id: 'teacher-b',
    instruction: `{B} opens by saying they just learned something fascinating and wants to share it. {B} explains the concept, then quizzes {A} to check understanding. {A} answers (correctly or almost), and {B} refines.`,
  },
  {
    id: 'b-confesses-confusion',
    instruction: `{B} admits they always mix this concept up with something similar. {A} — who happens to know this one well — explains the difference clearly. {B} thanks them and adds a mnemonic to remember.`,
  },
  {
    id: 'b-reads-textbook',
    instruction: `{B} says they just read about this in the textbook and reads a dense definition. {A} says "wait, in normal words please?" {B} then re-explains in simple, conversational language. Both agree the simple version is better.`,
  },
  {
    id: 'b-overheard',
    instruction: `{B} overheard someone explain this topic incorrectly and wants to set the record straight. {B} shares what they heard, {A} identifies the error, and together they build the correct explanation.`,
  },
  {
    id: 'b-flashback',
    instruction: `{B} opens with "Remember when we studied [related topic]? This is connected..." and builds from prior knowledge to the new concept. {A} makes the connection and extends it further.`,
  },

  // === GROUP 3: Collaborative / equal energy ===
  {
    id: 'study-buddy',
    instruction: `Both are studying together. {A} reads the question from their notes. They both try to answer simultaneously — {A} gets part right, {B} completes it. They piece together the full answer as a team.`,
  },
  {
    id: 'explain-to-grandma',
    instruction: `{A} proposes a challenge: explain this concept so simply that your grandma would understand it. {B} tries first, then {A} attempts an even simpler version. They pick the best explanation.`,
  },
  {
    id: 'speed-round',
    instruction: `{A} and {B} do a rapid-fire exchange. {A} asks, {B} gives a quick answer, {A} says "more detail!", {B} expands, {A} says "example!", {B} gives one. Fast energy, short sentences.`,
  },
  {
    id: 'mnemonic-battle',
    instruction: `After briefly covering the concept, {A} and {B} compete to create the best mnemonic or memory trick for remembering it. They each propose one and vote on the winner.`,
  },
  {
    id: 'what-if',
    instruction: `{A} asks the question, {B} answers, then {A} follows up with "but what if...?" hypotheticals. {B} handles each what-if, showing deeper understanding. They end with the key takeaway.`,
  },

  // === GROUP 4: Creative / unconventional ===
  {
    id: 'movie-analogy',
    instruction: `{B} explains the concept using an analogy from a popular movie, TV show, or video game. {A} is initially skeptical but then sees how the analogy works perfectly. Both build on it.`,
  },
  {
    id: 'time-traveler',
    instruction: `{A} pretends to be from 100 years ago and doesn't understand modern concepts. {B} explains the topic in historical context, making it both educational and entertaining. {A} is amazed.`,
  },
  {
    id: 'reverse-engineer',
    instruction: `{B} gives the answer FIRST without context. {A} tries to guess what the question was. Through this reverse process, the concept becomes clearer. Then {A} states the proper question-answer pair.`,
  },
  {
    id: 'three-words',
    instruction: `{A} challenges {B}: "Explain this in exactly three words." {B} tries and fails hilariously, then gives a proper explanation. They discuss why the concept can't be simplified THAT much, which reveals its depth.`,
  },
  {
    id: 'podcast-recap',
    instruction: `{A} opens as if doing a podcast recap: "On today's episode..." and sets up the topic dramatically. {B} plays the guest expert and gives a polished answer. {A} summarizes key points at the end like a show host.`,
  },
];

/**
 * Assign templates to cards ensuring no two consecutive cards use the same template,
 * and distributing evenly across the 4 groups for variety.
 */
function assignTemplates(count: number): typeof CONVERSATION_TEMPLATES[number][] {
  const templates = [...CONVERSATION_TEMPLATES];
  const result: typeof CONVERSATION_TEMPLATES[number][] = [];
  let lastUsed = -1;

  for (let i = 0; i < count; i++) {
    // Pick from a different group than the last card when possible
    const lastGroup = lastUsed >= 0 ? Math.floor(lastUsed / 5) : -1;
    const candidates = templates
      .map((t, idx) => ({ t, idx }))
      .filter(({ idx }) => Math.floor(idx / 5) !== lastGroup);

    const pool = candidates.length > 0 ? candidates : templates.map((t, idx) => ({ t, idx }));
    const pick = pool[Math.floor(Math.random() * pool.length)];
    result.push(pick.t);
    lastUsed = pick.idx;
  }

  return result;
}

export async function writeDialogue(
  cards: FlashcardInput[],
  language: string = 'en'
): Promise<DialogueScript[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY is required');

  const names = VOICE_NAMES[language] || VOICE_NAMES.en;
  const batchSize = 5;
  const results: DialogueScript[] = [];

  // Assign a unique template to each card
  const templates = assignTemplates(cards.length);

  for (let i = 0; i < cards.length; i += batchSize) {
    const batch = cards.slice(i, i + batchSize);
    const batchTemplates = templates.slice(i, i + batchSize);
    const batchResults = await generateDialogueBatch(batch, batchTemplates, names, language, apiKey);
    results.push(...batchResults);
  }

  return results;
}

async function generateDialogueBatch(
  cards: FlashcardInput[],
  templates: typeof CONVERSATION_TEMPLATES[number][],
  names: { A: string; B: string },
  language: string,
  apiKey: string
): Promise<DialogueScript[]> {
  const langName = language === 'en' ? 'English' : language === 'de' ? 'German' : language;

  const cardBlocks = cards.map((c, i) => {
    const tmpl = templates[i] || CONVERSATION_TEMPLATES[0];
    const instruction = tmpl.instruction
      .replace(/\{A\}/g, names.A)
      .replace(/\{B\}/g, names.B);

    return `--- CARD ${i + 1} (ID: ${c.id}) ---
Question: ${c.front}
Answer: ${c.back}
Extra context: ${c.explanation}
CONVERSATION STYLE [${tmpl.id}]: ${instruction}`;
  }).join('\n\n');

  const prompt = `You are a podcast script writer creating educational audio flashcards. Two hosts:
- ${names.A} (Speaker A, female): Energetic, relatable, connects topics to student life
- ${names.B} (Speaker B, male): Knowledgeable, uses analogies, gives study tips

IMPORTANT: Each card below has a specific CONVERSATION STYLE instruction. Follow it closely — this is what makes each card sound different and keeps the podcast fresh. Do NOT fall into a repetitive pattern.

${cardBlocks}

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

Rules:
- Follow each card's CONVERSATION STYLE closely — they are intentionally different
- 4-8 segments per card (alternating speakers)
- Conversational, natural tone — two friends studying together
- Language: ${langName}
- NO filler words ("um", "uh", "like")
- Include one think-pause: { "speaker": "A", "text": "[pause]" } at a dramatic moment
- Each card's dialogue MUST feel distinct from the others

Return ONLY valid JSON array, no markdown fences.`;

  const response = await fetch(`${GEMINI_TEXT_API}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
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

  return parseGeminiJSON(text);
}
