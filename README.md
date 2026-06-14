# PDF Q&A AI Agent in Node.js

This is a simple learning project for building an AI agent that reads a PDF and answers questions from it.

The project uses a common pattern called RAG, which means Retrieval Augmented Generation:

1. Extract text from the PDF.
2. Split the text into smaller chunks.
3. Convert each chunk into an embedding vector.
4. When you ask a question, embed the question too.
5. Find the PDF chunks most similar to the question.
6. Send only those chunks to the AI model and ask it to answer from that context.

This is better than pasting the whole PDF into the model because large PDFs may not fit in the model context, and retrieval keeps the answer focused.

## Requirements

- Node.js 18 or newer
- A Gemini API key
- A PDF that contains selectable text

If your PDF is a scanned image, this app will not read it directly. You need OCR first.

## Setup

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
copy .env.example .env
```

Then edit `.env` and set:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Optional model settings:

```bash
ANSWER_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=gemini-embedding-001
TOP_K=3
MAX_OUTPUT_TOKENS=350
REQUEST_TIMEOUT_MS=30000
STREAM_ANSWERS=true
```

## Run

Start the PDF chat:

```bash
npm run chat -- ./your-file.pdf
```

Then ask questions:

```text
> What is the main topic of this PDF?
> Summarize chapter 2
> What does it say about pricing?
> exit
```

The first run creates a local cache in `.cache/`. The next time you open the same PDF, it reuses the cached embeddings without parsing the PDF again.

## Project Structure

```text
src/index.js       Main CLI chat loop
src/pdf.js         Reads text from a PDF
src/chunk.js       Splits long PDF text into chunks
src/embeddings.js  Creates embeddings and compares vectors
src/retriever.js   Finds the most relevant chunks for a question
.cache/            Local generated embedding cache
```

## How It Works

### PDF extraction

`src/pdf.js` uses `pdf-parse` to extract text from the PDF file.

### Chunking

`src/chunk.js` splits the text into chunks of about 1400 characters with overlap. Overlap helps because important meaning can sit at the boundary between two chunks.

### Embeddings

`src/embeddings.js` sends text to the Gemini embeddings API. The embedding model returns arrays of numbers that represent meaning.

### Retrieval

`src/retriever.js` uses cosine similarity to compare the question embedding with all PDF chunk embeddings. The top matching chunks are passed to the answer model.

### Answering

`src/index.js` sends the retrieved context and your question to the Gemini API. The prompt tells the model to answer only from the PDF context and include source numbers. Answers stream by default, so text appears as soon as the API starts returning it.

### Speed settings

- `TOP_K` controls how many chunks are sent to the answer model. Lower is faster; higher can improve recall.
- `MAX_OUTPUT_TOKENS` limits answer length to keep responses quick.
- `REQUEST_TIMEOUT_MS` fails slow API calls instead of waiting forever.
- `STREAM_ANSWERS=false` disables streaming if you prefer one complete answer at a time.

## Useful Commands

Check JavaScript syntax:

```bash
npm run check
```

Run chat:

```bash
npm run chat -- ./your-file.pdf
```

Clear cached indexes:

```bash
Remove-Item -Recurse -Force .cache
```

## Learning Notes

- This project uses local JSON cache for simplicity.
- A production app would usually use a vector database.
- For better citations, you can improve chunking to track page numbers.
- For scanned PDFs, add OCR before `readPdfText`.
- For very large PDFs, batch embeddings in smaller groups to avoid request size limits.

## Gemini APIs Used

- Gemini text generation for the final natural-language answer.
- Gemini embeddings for semantic search over PDF chunks.
