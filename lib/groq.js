/**
 * lib/groq.js
 * Groq LLM client for generating streaming answers over retrieved PDF context.
 *
 * Model: llama-3.3-70b-versatile (high-quality, fast inference via Groq)
 * Streaming: uses Groq's SSE-compatible async iterator interface
 */
import Groq from 'groq-sdk';

// ─── Client Factory ───────────────────────────────────────────────────────────

/**
 * Creates and returns a configured Groq client.
 * Called once per API request — Groq SDK handles connection reuse.
 *
 * @returns {Groq}
 */
export function createGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing GROQ_API_KEY environment variable.');
  return new Groq({ apiKey });
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert research assistant analyzing PDF documents.
You answer questions using ONLY the provided source excerpts from the document.
Rules you must follow strictly:
- Base every answer on the provided SOURCE excerpts. Never invent facts.
- When referencing a source, cite it inline like [SOURCE 1] or [SOURCE 2].
- If the answer is not in the provided excerpts, say: "I could not find this in the document."
- Be concise but thorough. Use markdown formatting for clarity (bold, lists, etc.).
- Multiple sources can be combined if they complement each other.
- Never answer from general knowledge outside the provided document.`.trim();

// ─── Streaming Answer Generator ───────────────────────────────────────────────

/**
 * Returns a Groq streaming completion for the given question + context.
 * The caller consumes the async iterator to stream text tokens.
 *
 * @param {Groq}   groq
 * @param {string} question    - User's question
 * @param {string} context     - Formatted PDF source excerpts
 * @param {object} options
 * @param {string} [options.model]          - Defaults to GROQ_MODEL env or llama-3.3-70b-versatile
 * @param {number} [options.maxTokens]      - Max output tokens
 * @param {number} [options.temperature]    - LLM temperature (0.1–0.5 for factual QA)
 * @returns {Promise<AsyncIterable>}         Groq stream iterable
 */
export async function streamAnswer(groq, question, context, options = {}) {
  const model       = options.model       ?? process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';
  const maxTokens   = options.maxTokens   ?? parseInt(process.env.MAX_OUTPUT_TOKENS ?? '800', 10);
  const temperature = options.temperature ?? 0.2;

  const userMessage = buildUserMessage(question, context);

  return groq.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userMessage   },
    ],
    stream:      true,
    max_tokens:  maxTokens,
    temperature,
  });
}

/**
 * Non-streaming version — returns the complete answer text at once.
 * Useful for very short answers or when streaming is not needed.
 *
 * @param {Groq}   groq
 * @param {string} question
 * @param {string} context
 * @param {object} options
 * @returns {Promise<string>}
 */
export async function getAnswer(groq, question, context, options = {}) {
  const model       = options.model       ?? process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';
  const maxTokens   = options.maxTokens   ?? parseInt(process.env.MAX_OUTPUT_TOKENS ?? '800', 10);
  const temperature = options.temperature ?? 0.2;

  const response = await groq.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: buildUserMessage(question, context) },
    ],
    stream:      false,
    max_tokens:  maxTokens,
    temperature,
  });

  return response.choices[0]?.message?.content ?? 'No answer returned.';
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function buildUserMessage(question, context) {
  return `Here are the relevant excerpts from the document:\n\n${context}\n\n---\n\nQuestion: ${question}`;
}
