import type { ResearchResult } from '@/types/research';
import { GEMINI_TEXT_API, parseGeminiJSON } from './gemini-config';

interface ResearchOptions {
  topic: string;
  language?: string;
  depth?: 'quick' | 'standard' | 'deep';
}

interface DocumentResearchOptions {
  text: string;
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

  const response = await fetch(`${GEMINI_TEXT_API}?key=${apiKey}`, {
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

  const result: ResearchResult = parseGeminiJSON(text);
  result.language = language;
  result.generatedAt = new Date().toISOString();

  return result;
}

export async function researchFromDocument(options: DocumentResearchOptions): Promise<ResearchResult> {
  const { text, language = 'en', depth = 'standard' } = options;
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY is required');

  const conceptCount = depth === 'quick' ? 10 : depth === 'deep' ? 30 : 20;
  const langName = language === 'en' ? 'English' : language === 'de' ? 'German' : language;

  // Truncate very long documents to stay within token limits
  const maxChars = 80_000;
  const truncated = text.length > maxChars ? text.slice(0, maxChars) + '\n[...truncated]' : text;

  const prompt = `You are an expert educational researcher. Analyze the following document and extract the most important concepts a student needs to know from it.

--- DOCUMENT START ---
${truncated}
--- DOCUMENT END ---

Language for output: ${langName}
Depth: Extract ${conceptCount} key concepts.

Return a JSON object with this exact structure:
{
  "topic": "The main topic/title inferred from the document",
  "summary": "A 2-3 sentence overview of the document's content",
  "keyConcepts": [
    {
      "term": "The key term or concept name",
      "definition": "A clear, concise definition (1-2 sentences)",
      "explanation": "A more detailed explanation with context (2-3 sentences)",
      "example": "A concrete example illustrating the concept"
    }
  ],
  "sources": ["Document provided by user"]
}

Requirements:
- Extract concepts ONLY from the document content — do not add external knowledge
- Order concepts from foundational to advanced
- Each concept must be self-contained
- Definitions should be precise enough for exam preparation
- Examples should come from or relate to the document content
- Use ${langName} throughout

Return ONLY valid JSON, no markdown fences.`;

  const response = await fetch(`${GEMINI_TEXT_API}?key=${apiKey}`, {
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
  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!resultText) throw new Error('Empty response from Gemini');

  const result: ResearchResult = parseGeminiJSON(resultText);
  result.language = language;
  result.generatedAt = new Date().toISOString();

  return result;
}
