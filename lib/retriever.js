/**
 * lib/retriever.js
 * Retrieves the most semantically relevant PDF chunks for a given question.
 * Supports both in-memory cosine similarity (fallback) and DB-level vector search.
 */
import { embedTexts, cosineSimilarity } from './embeddings.js';

/**
 * Retrieves top-K most relevant chunks from an in-memory index.
 * Used as a fallback when chunks are already loaded from DB.
 *
 * @param {import('@google/genai').GoogleGenAI} ai
 * @param {{ embeddingModel: string, chunks: { id: number, content: string, embedding: number[] }[] }} index
 * @param {string} question
 * @param {object} options
 * @param {number}  [options.topK=4]
 * @param {number}  [options.timeoutMs]
 * @param {Map}     [options.embeddingCache]
 * @returns {Promise<{ id: number, content: string, score: number }[]>}
 */
export async function retrieveRelevantChunks(ai, index, question, options = {}) {
  const topK     = options.topK ?? 4;
  const cacheKey = normalizeQuestion(question);

  const cachedEmbedding = options.embeddingCache?.get(cacheKey);
  const questionEmbedding = cachedEmbedding ?? (
    await embedTexts(ai, [question], index.embeddingModel, {
      taskType: 'QUESTION_ANSWERING',
      timeoutMs: options.timeoutMs,
    })
  )[0];

  if (!cachedEmbedding) {
    options.embeddingCache?.set(cacheKey, questionEmbedding);
  }

  return index.chunks
    .map((chunk) => ({
      id:      chunk.id ?? chunk.chunk_index,
      content: chunk.content,
      score:   cosineSimilarity(chunk.embedding, questionEmbedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Embeds a user question for vector search against the DB.
 *
 * @param {import('@google/genai').GoogleGenAI} ai
 * @param {string} question
 * @param {string} embeddingModel
 * @param {number} [timeoutMs]
 * @returns {Promise<number[]>} The question embedding vector
 */
export async function embedQuestion(ai, question, embeddingModel, timeoutMs) {
  const results = await embedTexts(ai, [question], embeddingModel, {
    taskType: 'QUESTION_ANSWERING',
    timeoutMs,
  });
  return results[0];
}

/**
 * Formats retrieved chunks into a readable context block for the LLM prompt.
 *
 * @param {{ id: number, content: string, score: number }[]} chunks
 * @returns {string}
 */
export function formatContext(chunks) {
  return chunks
    .map((chunk) => {
      const score = chunk.score?.toFixed(3) ?? 'N/A';
      const id    = chunk.id ?? chunk.chunk_index;
      return `SOURCE ${id} | relevance ${score}\n${chunk.content}`;
    })
    .join('\n\n---\n\n');
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

function normalizeQuestion(question) {
  return question.trim().replace(/\s+/g, ' ').toLowerCase();
}
