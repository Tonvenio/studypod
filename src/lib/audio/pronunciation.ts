interface PronunciationEntry {
  pattern: RegExp;
  replacement: string;
}

const COMMON_FIXES: PronunciationEntry[] = [
  // Numbers with units
  { pattern: /(\d+)%/g, replacement: '$1 percent' },
  { pattern: /(\d+)km/g, replacement: '$1 kilometers' },

  // Common abbreviations
  { pattern: /\be\.g\./g, replacement: 'for example' },
  { pattern: /\bi\.e\./g, replacement: 'that is' },
  { pattern: /\betc\./g, replacement: 'et cetera' },
  { pattern: /\bvs\./g, replacement: 'versus' },
  { pattern: /\bDr\./g, replacement: 'Doctor' },
  { pattern: /\bMr\./g, replacement: 'Mister' },
  { pattern: /\bMrs\./g, replacement: 'Missus' },

  // Math/science
  { pattern: /\bCO2\b/g, replacement: 'C O 2' },
  { pattern: /\bH2O\b/g, replacement: 'H 2 O' },
  { pattern: /\bDNA\b/g, replacement: 'D N A' },
  { pattern: /\bRNA\b/g, replacement: 'R N A' },
  { pattern: /\bAPI\b/g, replacement: 'A P I' },
  { pattern: /\bSQL\b/g, replacement: 'sequel' },
];

const GERMAN_FIXES: PronunciationEntry[] = [
  { pattern: /§§/g, replacement: 'Paragraphen' },
  { pattern: /§\s*(\d+)/g, replacement: 'Paragraph $1' },
  { pattern: /\bAbs\.\s*/g, replacement: 'Absatz ' },
  { pattern: /\bNr\.\s*/g, replacement: 'Nummer ' },
  { pattern: /\bArt\.\s*/g, replacement: 'Artikel ' },
  { pattern: /\bbzw\./g, replacement: 'beziehungsweise' },
  { pattern: /\bz\.B\./g, replacement: 'zum Beispiel' },
  { pattern: /\bd\.h\./g, replacement: 'das heißt' },
  { pattern: /\bu\.a\./g, replacement: 'unter anderem' },
  { pattern: /\bggf\./g, replacement: 'gegebenenfalls' },
];

export function preprocessForTTS(text: string, language: string = 'en'): string {
  let result = text;

  // Apply common fixes
  for (const fix of COMMON_FIXES) {
    result = result.replace(fix.pattern, fix.replacement);
  }

  // Apply language-specific fixes
  if (language === 'de') {
    for (const fix of GERMAN_FIXES) {
      result = result.replace(fix.pattern, fix.replacement);
    }
  }

  // Clean up multiple spaces
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}
