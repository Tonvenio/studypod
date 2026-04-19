import type { ResearchResult } from '@/types/research';

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

interface ResearchOptions {
  topic: string;
  language?: string;
  depth?: 'quick' | 'standard' | 'deep';
}

export async function researchTopic(options: ResearchOptions): Promise<ResearchResult> {
  const { topic, language = 'en', depth = 'standard' } = options;
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY is required');

  const conceptCount = depth === 'quick' ? 10 : depth === 'deep' ? 30 : 20;
  const langName = language === 'en' ? 'English' : language === 'de' ? 'German' : language;

  const prompt = `You are an expert educational researcher. Research the following topic thoroughly and extract the most important concepts a university student needs to know.

Topic: "${topic}"
Language: ${langName}
Depth: Extract ${conceptCount} key concepts.

Return a JSON object with this exact structure:
{
  "topic": "${topic}",
  "summary": "A 2-3 sentence overview of the topic",
  "keyConcepts": [
    {
      "term": "The key term or concept name",
      "definition": "A clear, concise definition (1-2 sentences)",
      "explanation": "A more detailed explanation with context (2-3 sentences)",
      "example": "A concrete example illustrating the concept"
    }
  ],
  "sources": ["List of academic/authoritative sources"]
}

Requirements:
- Order concepts from foundational to advanced
- Each concept must be self-contained (no "as mentioned above" references)
- Definitions should be precise enough for exam preparation
- Examples should be concrete and memorable
- Use ${langName} throughout

Return ONLY valid JSON, no markdown fences.`;

  const response = await fetch(`${GEMINI_API}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
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

  const result: ResearchResult = JSON.parse(text);
  result.language = language;
  result.generatedAt = new Date().toISOString();

  return result;
}
