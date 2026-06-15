/**
 * lib/db.js
 * Neon DB (PostgreSQL + pgvector) data access layer.
 *
 * Schema:
 *   pdf_sessions  — metadata per uploaded PDF (keyed by content hash)
 *   pdf_chunks    — individual text chunks with 768-dim embeddings
 *
 * pgvector uses the <=> operator for cosine distance (ascending = more similar).
 * Run `npm run db:setup` once to initialize the schema.
 */
import { neon } from '@neondatabase/serverless';

// ─── Connection ──────────────────────────────────────────────────────────────

/**
 * Returns a tagged-template SQL executor bound to the DATABASE_URL env var.
 * The Neon serverless driver uses HTTP pooling — ideal for Vercel serverless.
 */
function getSQL() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'Missing DATABASE_URL environment variable. ' +
      'Add your Neon connection string to .env.local.'
    );
  }
  return neon(url);
}

// ─── Session Operations ───────────────────────────────────────────────────────

/**
 * Finds an existing session by the SHA-256 hash of the PDF file.
 * This avoids re-embedding the same document on repeated uploads.
 *
 * @param {string} pdfHash
 * @returns {Promise<SessionRow|null>}
 */
export async function getSessionByHash(pdfHash) {
  const sql = getSQL();
  const rows = await sql`
    SELECT id, filename, pdf_hash, pages, chunk_count, embedding_model, created_at
    FROM   pdf_sessions
    WHERE  pdf_hash = ${pdfHash}
    LIMIT  1
  `;
  return rows[0] ?? null;
}

/**
 * Retrieves session metadata by session ID.
 *
 * @param {string} sessionId
 * @returns {Promise<SessionRow|null>}
 */
export async function getSessionById(sessionId) {
  const sql = getSQL();
  const rows = await sql`
    SELECT id, filename, pdf_hash, pages, chunk_count, embedding_model, created_at
    FROM   pdf_sessions
    WHERE  id = ${sessionId}
    LIMIT  1
  `;
  return rows[0] ?? null;
}

/**
 * Inserts a new PDF session record.
 *
 * @param {{ id: string, filename: string, pdfHash: string, pages: number, chunkCount: number, embeddingModel: string }} session
 */
export async function createSession(session) {
  const sql = getSQL();
  const { id, filename, pdfHash, pages, chunkCount, embeddingModel } = session;
  await sql`
    INSERT INTO pdf_sessions (id, filename, pdf_hash, pages, chunk_count, embedding_model)
    VALUES (${id}, ${filename}, ${pdfHash}, ${pages}, ${chunkCount}, ${embeddingModel})
    ON CONFLICT (pdf_hash) DO NOTHING
  `;
}

// ─── Chunk Operations ─────────────────────────────────────────────────────────

/**
 * Bulk-inserts pre-embedded chunks for a session.
 * Each chunk's embedding is stored as a pgvector `vector(768)`.
 *
 * @param {string} sessionId
 * @param {{ id: number, content: string, embedding: number[] }[]} chunks
 */
export async function storeChunks(sessionId, chunks) {
  const sql = getSQL();

  // Insert in parallel batches of 20 to stay within Neon's payload limits
  const batchSize = 20;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    await Promise.all(
      batch.map((chunk) =>
        sql`
          INSERT INTO pdf_chunks (session_id, chunk_index, content, embedding)
          VALUES (
            ${sessionId},
            ${chunk.id},
            ${chunk.content},
            ${JSON.stringify(chunk.embedding)}::vector
          )
        `
      )
    );
  }
}

/**
 * Retrieves the top-K most similar chunks to a question embedding
 * using pgvector's cosine distance operator (<=>).
 *
 * @param {string}   sessionId
 * @param {number[]} questionEmbedding  — 768-dimensional float vector
 * @param {number}   [topK=4]
 * @returns {Promise<{ chunk_index: number, content: string, similarity: number }[]>}
 */
export async function retrieveSimilarChunks(sessionId, questionEmbedding, topK = 4) {
  const sql = getSQL();
  const embeddingStr = JSON.stringify(questionEmbedding);

  const rows = await sql`
    SELECT
      chunk_index,
      content,
      1 - (embedding <=> ${embeddingStr}::vector) AS similarity
    FROM   pdf_chunks
    WHERE  session_id = ${sessionId}
    ORDER  BY embedding <=> ${embeddingStr}::vector ASC
    LIMIT  ${topK}
  `;

  return rows;
}

/**
 * Deletes all chunks for a session (used when re-embedding is needed).
 * @param {string} sessionId
 */
export async function deleteChunks(sessionId) {
  const sql = getSQL();
  await sql`DELETE FROM pdf_chunks WHERE session_id = ${sessionId}`;
}

/**
 * Returns the actual count of stored chunks for a session.
 * Used to detect broken sessions where the record exists but chunks failed to store.
 * @param {string} sessionId
 * @returns {Promise<number>}
 */
export async function getActualChunkCount(sessionId) {
  const sql = getSQL();
  const result = await sql`SELECT COUNT(*)::int AS n FROM pdf_chunks WHERE session_id = ${sessionId}`;
  return result[0]?.n ?? 0;
}

/**
 * Deletes a session and all its chunks (via CASCADE).
 * Used to clean up broken sessions from failed uploads.
 * @param {string} sessionId
 */
export async function deleteSessionById(sessionId) {
  const sql = getSQL();
  await sql`DELETE FROM pdf_sessions WHERE id = ${sessionId}`;
}
