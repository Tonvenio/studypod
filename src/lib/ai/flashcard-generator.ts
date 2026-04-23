import type { ResearchResult } from '@/types/research';
import { GEMINI_TEXT_API, parseGeminiJSON } from './gemini-config';

interface GeneratedFlashcard {
  front: string;
  back: string;
  explanation: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export async function generateFlashcards(research: ResearchResult): Promise<GeneratedFlashcard[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY is required');

  const langName = research.language === 'en' ? 'English' : research.language === 'de' ? 'German' : research.language;

  const prompt = `You are an expert flashcard creator for university students. Given the following research on "${research.topic}", create effective study flashcards.

Research Summary: ${research.summary}

Key Concepts:
${research.keyConcepts.map((c, i) => `${i + 1}. ${c.term}: ${c.definition} — ${c.explanation} (Example: ${c.example})`).join('\n')}

Create one flashcard per concept. Return a JSON array:
[
  {
    "front": "A clear question that tests understanding (not just recall)",
    "back": "A concise, complete answer (2-3 sentences max)",
    "explanation": "Why this answer is correct + a memorable tip or example",
    "difficulty": 1-5 (1=basic definition, 3=application, 5=synthesis/analysis)
  }
]

Flashcard best practices:
- Front: Ask "What", "How", "Why", or "Explain" questions — NOT "Define X"
- Back: Direct answer first, then brief elaboration
- Keep each card self-contained — no cross-references
- Vary question types: definition, comparison, application, cause-effect
- Language: ${langName}

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

  const cards: GeneratedFlashcard[] = parseGeminiJSON(text);

  return cards.map((card) => ({
    front: card.front.trim(),
    back: card.back.trim(),
    explanation: card.explanation?.trim() || '',
    difficulty: Math.min(5, Math.max(1, Math.round(card.difficulty || 3))) as 1 | 2 | 3 | 4 | 5,
  }));
}
