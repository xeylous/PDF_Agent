import { cosineSimilarity, embedTexts } from "./embeddings.js";

export async function retrieveRelevantChunks(ai, index, question, options = {}) {
  const topK = options.topK ?? 5;
  const cacheKey = normalizeQuestion(question);
  const cachedEmbedding = options.embeddingCache?.get(cacheKey);
  const questionEmbedding = cachedEmbedding ?? (await embedTexts(ai, [question], index.embeddingModel, {
    taskType: "QUESTION_ANSWERING",
    timeoutMs: options.timeoutMs
  }))[0];

  if (!cachedEmbedding) {
    options.embeddingCache?.set(cacheKey, questionEmbedding);
  }

  return index.chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(chunk.embedding, questionEmbedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function formatContext(chunks) {
  return chunks
    .map((chunk) => {
      const score = chunk.score.toFixed(3);
      return `SOURCE ${chunk.id} | similarity ${score}\n${chunk.content}`;
    })
    .join("\n\n---\n\n");
}

function normalizeQuestion(question) {
  return question.trim().replace(/\s+/g, " ").toLowerCase();
}
