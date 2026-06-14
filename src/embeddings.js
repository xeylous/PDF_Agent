export async function embedTexts(ai, texts, model, options = {}) {
  const batchSize = options.batchSize ?? 64;
  const taskType = options.taskType;
  const timeoutMs = options.timeoutMs;
  const embeddings = [];

  for (let start = 0; start < texts.length; start += batchSize) {
    const batch = texts.slice(start, start + batchSize);
    const request = ai.models.embedContent({
      model,
      contents: batch,
      config: taskType ? { taskType } : undefined
    });
    const response = timeoutMs
      ? await withTimeout(request, timeoutMs, "Embedding request timed out.")
      : await request;

    embeddings.push(...response.embeddings.map((item) => item.values));
  }

  return embeddings;
}

export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

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
