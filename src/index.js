import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { GoogleGenAI } from "@google/genai";

import { chunkText } from "./chunk.js";
import { embedTexts } from "./embeddings.js";
import { parsePdfBuffer, readPdfBytes } from "./pdf.js";
import { formatContext, retrieveRelevantChunks } from "./retriever.js";

const answerModel = process.env.ANSWER_MODEL || "gemini-2.5-flash";
const embeddingModel = process.env.EMBEDDING_MODEL || "gemini-embedding-001";
const topK = readPositiveInteger("TOP_K", 3);
const maxOutputTokens = readPositiveInteger("MAX_OUTPUT_TOKENS", 350);
const requestTimeoutMs = readPositiveInteger("REQUEST_TIMEOUT_MS", 30_000);
const streamAnswers = process.env.STREAM_ANSWERS !== "false";

async function main() {
  const pdfPath = process.argv[2];

  if (!pdfPath) {
    console.log("Usage: npm run chat -- ./path/to/file.pdf");
    process.exitCode = 1;
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY. Copy .env.example to .env and add your Gemini API key.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const absolutePdfPath = path.resolve(pdfPath);
  const index = await loadOrCreateIndex(ai, absolutePdfPath);
  const questionEmbeddingCache = new Map();

  console.log(`Loaded ${index.chunks.length} chunks from ${path.basename(absolutePdfPath)}.`);
  console.log("Ask questions about the PDF. Type 'exit' to quit.\n");

  const rl = readline.createInterface({ input, output });

  try {
    while (true) {
      const question = (await rl.question("> ")).trim();

      if (!question || ["exit", "quit"].includes(question.toLowerCase())) {
        break;
      }

      const relevantChunks = await retrieveRelevantChunks(ai, index, question, {
        topK,
        timeoutMs: requestTimeoutMs,
        embeddingCache: questionEmbeddingCache
      });

      if (streamAnswers) {
        output.write("\n");
        await streamAnswerFromContext(ai, question, relevantChunks);
        output.write("\n\n");
      } else {
        const answer = await answerFromContext(ai, question, relevantChunks);
        console.log(`\n${answer}\n`);
      }
    }
  } finally {
    rl.close();
  }
}

async function loadOrCreateIndex(ai, pdfPath) {
  const bytes = await readPdfBytes(pdfPath);
  const pdfHash = crypto.createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const cachePath = path.join(".cache", `${pdfHash}.json`);

  try {
    const cached = JSON.parse(await fs.readFile(cachePath, "utf8"));
    if (cached.embeddingModel === embeddingModel) {
      return cached;
    }
  } catch {
    // No cache yet, so build it below.
  }

  console.log("Creating searchable PDF index. This may take a moment on the first run...");
  const { text, pages } = await parsePdfBuffer(bytes);
  const chunks = chunkText(text);
  const embeddings = await embedTexts(ai, chunks.map((chunk) => chunk.content), embeddingModel, {
    taskType: "RETRIEVAL_DOCUMENT",
    timeoutMs: requestTimeoutMs
  });

  const index = {
    pdfPath,
    pdfHash,
    pages,
    embeddingModel,
    createdAt: new Date().toISOString(),
    chunks: chunks.map((chunk, i) => ({
      ...chunk,
      embedding: embeddings[i]
    }))
  };

  await fs.mkdir(".cache", { recursive: true });
  await fs.writeFile(cachePath, JSON.stringify(index));
  return index;
}

async function answerFromContext(ai, question, chunks) {
  const context = formatContext(chunks);
  const response = await withTimeout(ai.models.generateContent({
    model: answerModel,
    contents: `PDF context:\n${context}\n\nQuestion: ${question}`,
    config: answerConfig()
  }), requestTimeoutMs, "Answer generation timed out.");

  return response.text ?? "No answer returned.";
}

async function streamAnswerFromContext(ai, question, chunks) {
  const context = formatContext(chunks);
  const stream = await withTimeout(ai.models.generateContentStream({
    model: answerModel,
    contents: `PDF context:\n${context}\n\nQuestion: ${question}`,
    config: answerConfig()
  }), requestTimeoutMs, "Answer generation timed out.");

  let wroteText = false;
  for await (const chunk of stream) {
    if (chunk.text) {
      wroteText = true;
      output.write(chunk.text);
    }
  }

  if (!wroteText) {
    output.write("No answer returned.");
  }
}

function answerConfig() {
  return {
    temperature: 0.2,
    maxOutputTokens,
    systemInstruction: [
      "You answer questions using only the provided PDF context.",
      "If the answer is not in the context, say you cannot find it in the PDF.",
      "Keep answers concise unless the user asks for detail.",
      "Give a clear answer and include source numbers like [SOURCE 2].",
      "Do not invent facts outside the PDF."
    ].join(" ")
  };
}

function readPositiveInteger(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
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

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
