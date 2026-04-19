/**
 * Mainstream Design Validator for studypod.ai
 *
 * Checks component files against a list of "generic SaaS template" patterns
 * that should be avoided to maintain the pixel-art-inspired unique design.
 *
 * Usage:
 *   npx ts-node src/lib/design/mainstream-validator.ts [file-or-directory]
 */

interface Violation {
  file: string;
  line: number;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
  suggestion: string;
}

interface ValidationRule {
  id: string;
  pattern: RegExp;
  message: string;
  severity: 'error' | 'warning';
  suggestion: string;
}

const MAINSTREAM_RULES: ValidationRule[] = [
  // === ROUNDED CORNERS: Generic SaaS uses rounded-2xl/xl everywhere ===
  {
    id: 'no-rounded-2xl',
    pattern: /rounded-2xl/g,
    message: 'Generic rounded-2xl corner detected — use pixel-border or pixel-border-sm instead',
    severity: 'error',
    suggestion: 'Replace with className="pixel-border" for 8-bit stepped corners',
  },
  {
    id: 'no-rounded-xl',
    pattern: /rounded-xl(?![\w-])/g,
    message: 'Generic rounded-xl corner detected — use sharp edges or pixel-border-sm',
    severity: 'warning',
    suggestion: 'Use pixel-border-sm for small elements, or remove rounding entirely',
  },
  {
    id: 'no-rounded-full',
    pattern: /rounded-full/g,
    message: 'Circular/pill shape is a mainstream SaaS pattern',
    severity: 'warning',
    suggestion: 'Use pixel-border-sm for badges/pills instead of rounded-full',
  },

  // === COLORS: Generic SaaS purple/green palette ===
  {
    id: 'no-old-purple',
    pattern: /#6C3AED/g,
    message: 'Old generic purple #6C3AED detected — use new pixel palette #7B5CFF',
    severity: 'error',
    suggestion: 'Replace with #7B5CFF (pixel purple)',
  },
  {
    id: 'no-old-green',
    pattern: /#10B981/g,
    message: 'Old generic green #10B981 detected — use new pixel palette #00E896',
    severity: 'error',
    suggestion: 'Replace with #00E896 (pixel accent green)',
  },
  {
    id: 'no-old-background',
    pattern: /#0F172A/g,
    message: 'Old generic background #0F172A detected — use #0B0E17',
    severity: 'error',
    suggestion: 'Replace with #0B0E17 (deeper pixel dark)',
  },
  {
    id: 'no-old-surface',
    pattern: /#1E293B/g,
    message: 'Old generic surface #1E293B detected — use #151A2B',
    severity: 'error',
    suggestion: 'Replace with #151A2B (pixel surface)',
  },
  {
    id: 'no-old-border',
    pattern: /#334155/g,
    message: 'Old generic border #334155 detected — use #2A3352',
    severity: 'error',
    suggestion: 'Replace with #2A3352 (pixel border)',
  },
  {
    id: 'no-old-muted',
    pattern: /#94A3B8/g,
    message: 'Old generic muted #94A3B8 detected — use #6B7A99',
    severity: 'warning',
    suggestion: 'Replace with #6B7A99 (pixel muted)',
  },

  // === TYPOGRAPHY: No pixel font on headlines ===
  {
    id: 'require-pixel-font-h1',
    pattern: /<h1[^>]*className="[^"]*font-bold[^"]*"[^>]*>/g,
    message: 'H1 headline without pixel font — use font-[family-name:var(--font-press-start)]',
    severity: 'warning',
    suggestion: 'Add font-[family-name:var(--font-press-start)] to headline elements',
  },

  // === GENERIC SaaS PATTERNS ===
  {
    id: 'no-how-it-works',
    pattern: /How it works/gi,
    message: '"How it works" is the most generic SaaS section title',
    severity: 'error',
    suggestion: 'Use game-inspired language: "Abilities Unlocked", "Quest Log", "Your Loadout"',
  },
  {
    id: 'no-generic-stats',
    pattern: /\d+K\+.*(?:users|students|created)/gi,
    message: 'Generic vanity metrics counter is a SaaS template cliche',
    severity: 'warning',
    suggestion: 'Replace with game-inspired metrics: "Quests Completed", "XP Earned", "Levels Gained"',
  },
  {
    id: 'no-smooth-transition',
    pattern: /transition-colors/g,
    message: 'Smooth color transition is anti-pixel — use transition-pixel (stepped)',
    severity: 'warning',
    suggestion: 'Replace transition-colors with transition-pixel for stepped retro transitions',
  },
  {
    id: 'no-animate-spin',
    pattern: /animate-spin/g,
    message: 'Smooth spin animation is anti-pixel aesthetic',
    severity: 'warning',
    suggestion: 'Consider a stepped frame animation or pixel loading bar instead',
  },

  // === LAYOUT ===
  {
    id: 'no-3col-grid',
    pattern: /grid-cols-3.*gap-8/g,
    message: '3-column grid with gap-8 is the most generic SaaS layout',
    severity: 'warning',
    suggestion: 'Use 2-column grid, vertical list, or game menu layout instead',
  },
];

export function validateFile(content: string, filePath: string): Violation[] {
  const violations: Violation[] = [];
  const lines = content.split('\n');

  for (const rule of MAINSTREAM_RULES) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (rule.pattern.test(line)) {
        violations.push({
          file: filePath,
          line: i + 1,
          rule: rule.id,
          message: rule.message,
          severity: rule.severity,
          suggestion: rule.suggestion,
        });
        // Reset regex lastIndex for global patterns
        rule.pattern.lastIndex = 0;
      }
    }
  }

  return violations;
}

export function formatViolations(violations: Violation[]): string {
  if (violations.length === 0) return 'No mainstream design patterns detected!';

  const errors = violations.filter((v) => v.severity === 'error');
  const warnings = violations.filter((v) => v.severity === 'warning');

  let output = `\nMAINSTREAM DESIGN VALIDATOR\n${'='.repeat(50)}\n`;

  if (errors.length > 0) {
    output += `\nERRORS (${errors.length}):\n`;
    for (const v of errors) {
      output += `  ${v.file}:${v.line}\n`;
      output += `    ${v.message}\n`;
      output += `    -> ${v.suggestion}\n\n`;
    }
  }

  if (warnings.length > 0) {
    output += `\nWARNINGS (${warnings.length}):\n`;
    for (const v of warnings) {
      output += `  ${v.file}:${v.line}\n`;
      output += `    ${v.message}\n`;
      output += `    -> ${v.suggestion}\n\n`;
    }
  }

  output += `${'='.repeat(50)}\n`;
  output += `Total: ${errors.length} errors, ${warnings.length} warnings\n`;

  return output;
}

// CLI runner
if (typeof require !== 'undefined' && require.main === module) {
  const fs = require('fs');
  const path = require('path');

  const target = process.argv[2] || 'src/';
  const allViolations: Violation[] = [];

  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanDir(fullPath);
      } else if (entry.isFile() && /\.(tsx?|css)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        allViolations.push(...validateFile(content, fullPath));
      }
    }
  }

  if (fs.statSync(target).isDirectory()) {
    scanDir(target);
  } else {
    const content = fs.readFileSync(target, 'utf-8');
    allViolations.push(...validateFile(content, target));
  }

  console.log(formatViolations(allViolations));
  process.exit(allViolations.filter((v) => v.severity === 'error').length > 0 ? 1 : 0);
}
