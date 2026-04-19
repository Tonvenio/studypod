import type { ResearchResult } from '@/types/research';

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

interface FlashcardToCheck {
  front: string;
  back: string;
  explanation: string;
  difficulty: number;
}

interface FactCheckResult {
  cardIndex: number;
  verdict: 'pass' | 'fix' | 'remove';
  issue?: string;
  correctedBack?: string;
  correctedExplanation?: string;
}

interface FactCheckOutput {
  results: FactCheckResult[];
  removedCount: number;
  fixedCount: number;
}

/**
 * Fact-check generated flashcards against the original research.
 * Runs a second Gemini call that compares each Q&A pair to the source material.
 * Returns corrected cards — fixes minor errors, removes hallucinated ones.
 */
export async function factCheckFlashcards(
  cards: FlashcardToCheck[],
  research: ResearchResult
): Promise<{ cards: FlashcardToCheck[]; report: FactCheckOutput }> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY is required');

  const sourceKnowledge = research.keyConcepts
    .map((c, i) => `${i + 1}. ${c.term}: ${c.definition} — ${c.explanation} (Example: ${c.example})`)
    .join('\n');

  const cardList = cards
    .map((c, i) => `[Card ${i}] Q: ${c.front}\nA: ${c.back}\nExplanation: ${c.explanation}`)
    .join('\n\n');

  const prompt = `You are a rigorous academic fact-checker. Your job is to verify that flashcard answers are factually correct based on the source research provided.

## SOURCE RESEARCH on "${research.topic}"
Summary: ${research.summary}

Key concepts:
${sourceKnowledge}

## FLASHCARDS TO VERIFY
${cardList}

## YOUR TASK
For EACH card, check:
1. Is the answer factually correct based on the source research?
2. Does the answer contain any claims NOT supported by the source?
3. Is the explanation accurate and not misleading?
4. Are there any subtle errors (wrong numbers, swapped terms, incorrect cause-effect)?

Return a JSON array with one entry per card:
[
  {
    "cardIndex": 0,
    "verdict": "pass",
  },
  {
    "cardIndex": 1,
    "verdict": "fix",
    "issue": "The answer incorrectly states X when the source says Y",
    "correctedBack": "The corrected answer text",
    "correctedExplanation": "The corrected explanation (or null if unchanged)"
  },
  {
    "cardIndex": 2,
    "verdict": "remove",
    "issue": "This claim appears nowhere in the source research and may be hallucinated"
  }
]

Verdicts:
- "pass": Factually correct, matches source research
- "fix": Contains a fixable error — provide corrected text
- "remove": Contains hallucinated or unsupported claims that can't be fixed

Be strict but fair. Minor phrasing differences are fine (pass). Wrong facts must be fixed or removed.

Return ONLY valid JSON array, no markdown fences.`;

  const response = await fetch(`${GEMINI_API}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1, // Very low — we want deterministic fact-checking
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    // On fact-check failure, return cards unchanged (don't block the pipeline)
    console.error('Fact-check API error, skipping verification');
    return {
      cards,
      report: { results: [], removedCount: 0, fixedCount: 0 },
    };
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return { cards, report: { results: [], removedCount: 0, fixedCount: 0 } };
  }

  let results: FactCheckResult[];
  try {
    results = JSON.parse(text);
  } catch {
    console.error('Fact-check returned invalid JSON, skipping');
    return { cards, report: { results: [], removedCount: 0, fixedCount: 0 } };
  }

  // Apply fixes and removals
  let fixedCount = 0;
  let removedCount = 0;
  const verifiedCards: FlashcardToCheck[] = [];

  for (let i = 0; i < cards.length; i++) {
    const check = results.find((r) => r.cardIndex === i);

    if (!check || check.verdict === 'pass') {
      verifiedCards.push(cards[i]);
      continue;
    }

    if (check.verdict === 'fix') {
      fixedCount++;
      verifiedCards.push({
        ...cards[i],
        back: check.correctedBack || cards[i].back,
        explanation: check.correctedExplanation || cards[i].explanation,
      });
      continue;
    }

    if (check.verdict === 'remove') {
      removedCount++;
      // Skip this card entirely
      continue;
    }

    // Unknown verdict — keep the card
    verifiedCards.push(cards[i]);
  }

  return {
    cards: verifiedCards,
    report: { results, removedCount, fixedCount },
  };
}
