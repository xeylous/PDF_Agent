/**
 * lib/pdf.js
 * Server-side PDF text extraction using pdf-parse.
 * Must run on Node.js runtime (not Edge) — enforced via route segment config.
 */

/**
 * Parses a PDF from a raw Buffer and returns normalized text + metadata.
 *
 * @param {Buffer} buffer
 * @returns {Promise<{ text: string, pages: number }>}
 */
export async function parsePdfBuffer(buffer) {
  // Dynamic import avoids Next.js bundler from trying to import test fixtures
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;

  const parsed = await pdfParse(buffer);
  const text   = normalizeText(parsed.text);

  if (!text) {
    throw new Error(
      'No selectable text found in this PDF. ' +
      'Scanned image PDFs require OCR preprocessing.'
    );
  }

  return {
    text,
    pages: parsed.numpages ?? 0,
  };
}

/**
 * Normalizes raw extracted text: unifies line endings,
 * collapses horizontal whitespace, reduces excessive blank lines.
 *
 * @param {string} text
 * @returns {string}
 */
function normalizeText(text) {
  return text
    .replace(/\r/g,          '\n')   // normalize CR/CRLF → LF
    .replace(/[ \t]+/g,      ' ')    // collapse horizontal whitespace
    .replace(/\n{3,}/g,      '\n\n') // max two consecutive newlines
    .trim();
}
