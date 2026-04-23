import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import path from 'path';
import os from 'os';

const SUPPORTED_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
]);

const SUPPORTED_EXTENSIONS = new Set(['pdf', 'txt', 'md', 'csv']);

export async function extractDocumentText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (!SUPPORTED_TYPES.has(file.type) && !SUPPORTED_EXTENSIONS.has(ext)) {
    throw new Error(
      `Unsupported file type: ${file.type || ext}. Supported: PDF, TXT, MD, CSV`,
    );
  }

  if (ext === 'pdf' || file.type === 'application/pdf') {
    return extractPdfText(file);
  }

  // Plain text formats
  return await file.text();
}

async function extractPdfText(file: File): Promise<string> {
  // Use system pdftotext (from poppler) if available, otherwise fall back to basic extraction
  const buffer = Buffer.from(await file.arrayBuffer());
  const tmpPath = path.join(os.tmpdir(), `studypod-pdf-${Date.now()}.pdf`);

  try {
    writeFileSync(tmpPath, buffer);

    // Try pdftotext (poppler-utils)
    try {
      const text = execSync(`pdftotext "${tmpPath}" -`, {
        encoding: 'utf-8',
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024,
      });
      if (text.trim().length > 20) return text;
    } catch {
      // pdftotext not installed, fall through
    }

    // Try python-based extraction
    try {
      const text = execSync(
        `python3 -c "
import sys
try:
    from pypdf import PdfReader
    r = PdfReader('${tmpPath}')
    print('\\n'.join(p.extract_text() or '' for p in r.pages))
except ImportError:
    try:
        import PyPDF2
        r = PyPDF2.PdfReader('${tmpPath}')
        print('\\n'.join(p.extract_text() or '' for p in r.pages))
    except ImportError:
        sys.exit(1)
"`,
        { encoding: 'utf-8', timeout: 30000, maxBuffer: 10 * 1024 * 1024 },
      );
      if (text.trim().length > 20) return text;
    } catch {
      // Python PDF libs not available
    }

    throw new Error(
      'PDF text extraction failed. Please install pdftotext (brew install poppler) or pypdf (pip install pypdf), or upload the document as a .txt file.',
    );
  } finally {
    try { unlinkSync(tmpPath); } catch {}
  }
}
