/**
 * lib/embeddings.js
 * Generates dense vector embeddings using the Google Gemini Embeddings API.
 * Used exclusively for encoding PDF chunks and user questions (not for LLM answers).
 */
import { GoogleGenAI } from '@google/genai';

const BATCH_SIZE     = 64;
// We request 768 dims via outputDimensionality — Gemini supports MRL (Matryoshka
// Representation Learning), so truncated vectors maintain high semantic quality.
// 768 fits within pgvector's 2000-dim index limit.
const EMBEDDING_DIM  = 768;

/**
 * Creates the shared Gemini AI client.
 * Call once per request — the SDK handles connection pooling.
 */
export function createEmbeddingClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY environment variable.');
  return new GoogleGenAI({ apiKey });
}

/**
 * Embeds an array of text strings in batches.
 *
 * @param {import('@google/genai').GoogleGenAI} ai
 * @param {string[]} texts
 * @param {string}   model      - e.g. 'gemini-embedding-001'
 * @param {object}   options
 * @param {string}   [options.taskType]   - 'RETRIEVAL_DOCUMENT' | 'QUESTION_ANSWERING'
 * @param {number}   [options.timeoutMs]
 * @returns {Promise<number[][]>}  Array of embedding vectors (float32)
 */
export async function embedTexts(ai, texts, model, options = {}) {
  const { taskType, timeoutMs } = options;
  const embeddings = [];

  for (let start = 0; start < texts.length; start += BATCH_SIZE) {
    const batch = texts.slice(start, start + BATCH_SIZE);

    const request = ai.models.embedContent({
      model,
      contents: batch,
      config: {
        ...(taskType ? { taskType } : {}),
        outputDimensionality: EMBEDDING_DIM, // Truncate to 768 via MRL
      },
    });

    const response = timeoutMs
      ? await withTimeout(request, timeoutMs, 'Embedding request timed out.')
      : await request;

    embeddings.push(...response.embeddings.map((item) => item.values));
  }

  return embeddings;
}

/**
 * Cosine similarity between two equal-length vectors.
 * Returns a value in [-1, 1]; higher = more similar.
 *
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
export function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export { EMBEDDING_DIM };

// ─── Internal Helpers ────────────────────────────────────────────────────────

async function withTimeout(promise, timeoutMs, message) {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout);
  }
}
