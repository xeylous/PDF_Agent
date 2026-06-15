/**
 * app/api/upload/route.js
 * POST /api/upload
 *
 * Accepts a PDF file via multipart/form-data.
 * Pipeline:
 *   1. Parse the PDF binary → extract text
 *   2. Chunk the text into overlapping segments
 *   3. Embed all chunks via Gemini Embeddings API
 *   4. Store session metadata + embedded chunks in Neon DB
 *   5. Return session ID + document metadata to the client
 *
 * Caching: If the same PDF (by SHA-256 hash) was previously indexed,
 * the existing session is returned immediately without re-embedding.
 */
import { NextResponse }          from 'next/server';
import crypto                    from 'node:crypto';
import { v4 as uuidv4 }          from 'uuid';
import { parsePdfBuffer }        from '@/lib/pdf.js';
import { chunkText }             from '@/lib/chunk.js';
import { createEmbeddingClient, embedTexts } from '@/lib/embeddings.js';
import { getSessionByHash, createSession, storeChunks, getActualChunkCount, deleteSessionById } from '@/lib/db.js';

// Next.js App Router route config
export const runtime    = 'nodejs';  // Required: pdf-parse needs Node.js
export const maxDuration = 60;       // Vercel Pro: 60s. Hobby: 10s (may be tight)

// Supported MIME types for validation
const ALLOWED_MIME_TYPES = ['application/pdf'];
const MAX_FILE_SIZE_MB   = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function POST(request) {
  try {
    // ── 1. Parse multipart form data ───────────────────────────────────────
    const formData = await request.formData();
    const file = formData.get('pdf');

    if (!file) {
      return errorResponse('No file provided. Send the PDF as "pdf" field.', 400);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return errorResponse(`Invalid file type: ${file.type}. Only PDF files are accepted.`, 415);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return errorResponse(`File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum is ${MAX_FILE_SIZE_MB} MB.`, 413);
    }

    const bytes    = Buffer.from(await file.arrayBuffer());
    const filename = file.name ?? 'document.pdf';

    // ── 2. Hash the file to check for cached sessions ──────────────────────
    const pdfHash = crypto
      .createHash('sha256')
      .update(bytes)
      .digest('hex')
      .slice(0, 16);

    const existingSession = await getSessionByHash(pdfHash);
    if (existingSession) {
      // Validate that chunks actually exist — a previous failed upload
      // may have created a session record with no stored embeddings.
      const chunkCount = await getActualChunkCount(existingSession.id);
      if (chunkCount > 0) {
        return NextResponse.json({
          sessionId:  existingSession.id,
          filename:   existingSession.filename,
          pages:      existingSession.pages,
          chunkCount: chunkCount,
          cached:     true,
          message:    'Document already indexed — using cached embeddings.',
        });
      }
      // Session exists but has no chunks — delete and re-process
      await deleteSessionById(existingSession.id);
    }

    // ── 3. Parse PDF text ──────────────────────────────────────────────────
    const { text, pages } = await parsePdfBuffer(bytes);

    // ── 4. Chunk the text ──────────────────────────────────────────────────
    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return errorResponse('PDF contains no extractable text chunks.', 422);
    }

    // ── 5. Embed all chunks ────────────────────────────────────────────────
    const embeddingModel   = process.env.EMBEDDING_MODEL ?? 'gemini-embedding-001';
    const requestTimeoutMs = parseInt(process.env.REQUEST_TIMEOUT_MS ?? '45000', 10);
    const ai               = createEmbeddingClient();

    const embeddings = await embedTexts(
      ai,
      chunks.map((c) => c.content),
      embeddingModel,
      { taskType: 'RETRIEVAL_DOCUMENT', timeoutMs: requestTimeoutMs }
    );

    const embeddedChunks = chunks.map((chunk, i) => ({
      ...chunk,
      embedding: embeddings[i],
    }));

    // ── 6. Persist to Neon DB ──────────────────────────────────────────────
    const sessionId = uuidv4();

    await createSession({
      id:             sessionId,
      filename,
      pdfHash,
      pages,
      chunkCount:     chunks.length,
      embeddingModel,
    });

    await storeChunks(sessionId, embeddedChunks);

    // ── 7. Return session metadata ─────────────────────────────────────────
    return NextResponse.json({
      sessionId,
      filename,
      pages,
      chunkCount: chunks.length,
      cached:     false,
      message:    `Document indexed: ${chunks.length} chunks embedded.`,
    });

  } catch (err) {
    console.error('[/api/upload] Error:', err);

    const msg = err.message ?? '';

    if (msg.includes('No selectable text')) {
      return errorResponse(err.message, 422);
    }
    if (msg.includes('GEMINI_API_KEY')) {
      return errorResponse('Gemini API key not configured on server.', 503);
    }
    if (msg.includes('DATABASE_URL') || msg.includes('Missing DATABASE')) {
      return errorResponse('Database not configured. Add DATABASE_URL to .env.local.', 503);
    }
    // pgvector / Neon DB schema errors
    if (msg.includes('relation') && msg.includes('does not exist')) {
      return errorResponse('Database schema not initialized. Run: npm run db:setup', 503);
    }
    // General DB connection error
    if (err.code === 'ECONNREFUSED' || msg.includes('connect') || err.name === 'NeonDbError') {
      return errorResponse('Database connection failed. Check your DATABASE_URL.', 503);
    }
    if (msg.includes('GROQ_API_KEY')) {
      return errorResponse('Groq API key not configured on server.', 503);
    }

    return errorResponse(`Failed to process PDF: ${msg || 'Unknown error. Check server logs.'}`, 500);
  }
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

function errorResponse(message, status) {
  return NextResponse.json({ error: message }, { status });
}
