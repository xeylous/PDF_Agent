/**
 * app/api/chat/route.js
 * POST /api/chat
 *
 * Accepts: { sessionId: string, question: string }
 * Returns: Server-Sent Events (SSE) stream
 *
 * Pipeline:
 *   1. Validate request + resolve session from Neon DB
 *   2. Embed the user's question via Gemini
 *   3. Retrieve top-K similar chunks via pgvector cosine distance
 *   4. Stream a Groq LLM answer over the retrieved context
 *   5. Emit SSE events: { text } per token, { done, sources } at end
 */
import { getSessionById, retrieveSimilarChunks } from '@/lib/db.js';
import { createEmbeddingClient }                 from '@/lib/embeddings.js';
import { embedQuestion, formatContext }           from '@/lib/retriever.js';
import { createGroqClient, streamAnswer }        from '@/lib/groq.js';

export const runtime     = 'nodejs';
export const maxDuration = 60;

// Number of chunks to retrieve per question
const TOP_K            = parseInt(process.env.TOP_K             ?? '4',     10);
const REQUEST_TIMEOUT  = parseInt(process.env.REQUEST_TIMEOUT_MS ?? '45000', 10);
const EMBEDDING_MODEL  = process.env.EMBEDDING_MODEL ?? 'gemini-embedding-001';

export async function POST(request) {
  // ── 1. Parse & validate request body ────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return sseError('Invalid JSON body.', 400);
  }

  const { sessionId, question } = body ?? {};

  if (!sessionId || typeof sessionId !== 'string') {
    return sseError('Missing or invalid "sessionId" field.', 400);
  }
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return sseError('Missing or empty "question" field.', 400);
  }

  const trimmedQuestion = question.trim();

  // ── 2. Resolve session from DB ───────────────────────────────────────────
  const session = await getSessionById(sessionId).catch(() => null);
  if (!session) {
    return sseError(`Session not found: ${sessionId}. Please re-upload the PDF.`, 404);
  }

  // ── 3. Build SSE streaming response ─────────────────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // ── 3a. Embed the question ─────────────────────────────────────────
        const ai               = createEmbeddingClient();
        const questionEmbedding = await embedQuestion(
          ai,
          trimmedQuestion,
          EMBEDDING_MODEL,
          REQUEST_TIMEOUT
        );

        // ── 3b. Vector search in Neon DB ──────────────────────────────────
        const rawChunks = await retrieveSimilarChunks(sessionId, questionEmbedding, TOP_K);

        if (rawChunks.length === 0) {
          send({ text: 'I could not find any relevant content in this document for your question.' });
          send({ done: true, sources: [] });
          controller.close();
          return;
        }

        // Normalise DB rows to the format expected by formatContext
        const chunks = rawChunks.map((row) => ({
          id:      row.chunk_index,
          content: row.content,
          score:   parseFloat(row.similarity),
        }));

        const context = formatContext(chunks);

        // ── 3c. Stream Groq LLM answer ────────────────────────────────────
        const groq       = createGroqClient();
        const groqStream = await streamAnswer(groq, trimmedQuestion, context);

        for await (const chunk of groqStream) {
          const token = chunk.choices[0]?.delta?.content ?? '';
          if (token) {
            send({ text: token });
          }
        }

        // ── 3d. Send sources + done signal ────────────────────────────────
        const sources = chunks.map((c) => ({
          id:         c.id,
          content:    c.content.slice(0, 300) + (c.content.length > 300 ? '…' : ''),
          similarity: c.score,
        }));

        send({ done: true, sources });
        controller.close();

      } catch (err) {
        console.error('[/api/chat] Stream error:', err);
        send({ error: err.message ?? 'An error occurred while generating the answer.' });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status:  200,
    headers: {
      'Content-Type':  'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering (important for Vercel/proxies)
    },
  });
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

/** Returns an immediate JSON error (non-streaming path, for validation failures). */
function sseError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
