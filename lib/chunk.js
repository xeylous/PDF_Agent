/**
 * lib/chunk.js
 * Splits extracted PDF text into overlapping chunks for RAG retrieval.
 *
 * Strategy: greedy paragraph grouping with character-level overlap.
 * Overlap ensures important context at chunk boundaries is preserved.
 */

/**
 * @param {string} text - Full extracted PDF text
 * @param {object} options
 * @param {number} [options.chunkSize=1400]  - Max chars per chunk
 * @param {number} [options.overlap=250]     - Overlap chars between chunks
 * @returns {{ id: number, content: string }[]}
 */
export function chunkText(text, options = {}) {
  const chunkSize = options.chunkSize ?? 1400;
  const overlap   = options.overlap   ?? 250;

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks  = [];
  let   current = '';

  for (const paragraph of paragraphs) {
    // Paragraph fits in current chunk
    if ((current + '\n\n' + paragraph).trim().length <= chunkSize) {
      current = (current + '\n\n' + paragraph).trim();
      continue;
    }

    // Flush current chunk, keep tail as overlap
    if (current) {
      chunks.push(current);
      current = tail(current, overlap);
    }

    // Short paragraph — add to next chunk
    if (paragraph.length <= chunkSize) {
      current = (current + '\n\n' + paragraph).trim();
      continue;
    }

    // Long paragraph — split by chunkSize with overlap
    for (let start = 0; start < paragraph.length; start += chunkSize - overlap) {
      chunks.push(paragraph.slice(start, start + chunkSize).trim());
    }
    current = '';
  }

  if (current) chunks.push(current);

  return chunks.map((content, index) => ({ id: index + 1, content }));
}

/** Returns the last `size` characters of `text`. */
function tail(text, size) {
  return text.length <= size ? text : text.slice(-size);
}
