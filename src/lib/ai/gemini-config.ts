// Centralized Gemini API configuration
// Update these model IDs if your Google AI API requires different versions

export const GEMINI_TEXT_MODEL = 'gemini-3-flash-preview';
export const GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image-preview';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export const GEMINI_TEXT_API = `${BASE_URL}/${GEMINI_TEXT_MODEL}:generateContent`;
export const GEMINI_IMAGE_API = `${BASE_URL}/${GEMINI_IMAGE_MODEL}:generateContent`;

/**
 * Safely parse JSON from Gemini responses that may contain trailing text
 * after the JSON object/array ends.
 */
export function parseGeminiJSON<T = unknown>(text: string): T {
  const trimmed = text.trim();
  // Try direct parse first
  try {
    return JSON.parse(trimmed);
  } catch {
    // Find the end of the root JSON structure
    const start = trimmed[0];
    if (start !== '{' && start !== '[') {
      throw new Error('Response does not start with { or [');
    }
    const close = start === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === start) depth++;
      else if (ch === close) {
        depth--;
        if (depth === 0) {
          return JSON.parse(trimmed.slice(0, i + 1));
        }
      }
    }
    throw new Error('Could not find complete JSON in response');
  }
}
