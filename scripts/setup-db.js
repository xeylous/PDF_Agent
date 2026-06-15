/**
 * scripts/setup-db.js
 * One-time database schema initialization for Neon DB + pgvector.
 *
 * Run with: npm run db:setup
 * Requires: DATABASE_URL in environment (loaded via --env-file=.env.local)
 *
 * Embedding dimension: 3072 (gemini-embedding-001 actual output size)
 */
import { neon } from '@neondatabase/serverless';

async function setupDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('❌  Missing DATABASE_URL. Add it to your .env.local file.');
    process.exit(1);
  }

  const sql = neon(url);
  console.log('🔌  Connected to Neon DB...\n');

  // 1. Enable pgvector extension
  console.log('📦  Enabling pgvector extension...');
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  console.log('    ✓ pgvector ready\n');

  // 2. PDF Sessions table
  console.log('🗂️   Creating pdf_sessions table...');
  await sql`
    CREATE TABLE IF NOT EXISTS pdf_sessions (
      id              TEXT        PRIMARY KEY,
      filename        TEXT        NOT NULL,
      pdf_hash        TEXT        NOT NULL UNIQUE,
      pages           INTEGER     DEFAULT 0,
      chunk_count     INTEGER     DEFAULT 0,
      embedding_model TEXT        DEFAULT 'gemini-embedding-001',
      created_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('    ✓ pdf_sessions ready\n');

  // 3. Drop and recreate pdf_chunks with correct vector(3072) dimension
  //    gemini-embedding-001 returns 3072-dimensional vectors (not 768)
  console.log('📄  Recreating pdf_chunks table (vector dimension: 768)...');
  await sql`DROP TABLE IF EXISTS pdf_chunks CASCADE`;
  await sql`
    CREATE TABLE pdf_chunks (
      id          SERIAL      PRIMARY KEY,
      session_id  TEXT        NOT NULL REFERENCES pdf_sessions(id) ON DELETE CASCADE,
      chunk_index INTEGER     NOT NULL,
      content     TEXT        NOT NULL,
      embedding   vector(768),
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('    ✓ pdf_chunks ready\n');

  // 4. Indexes
  console.log('🔍  Creating indexes...');
  await sql`
    CREATE INDEX IF NOT EXISTS idx_pdf_chunks_session_id
    ON pdf_chunks (session_id)
  `;

  // IVFFlat index for cosine similarity (optimal for 768-dim vectors)
  // lists=100 is a good starting point; increase for >100k vectors
  await sql`
    CREATE INDEX IF NOT EXISTS idx_pdf_chunks_embedding
    ON pdf_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100)
  `;
  console.log('    ✓ Indexes ready\n');

  console.log('✅  Database setup complete!');
  console.log('    Vector column: vector(768) — Gemini MRL-truncated for pgvector compatibility');
  console.log('    Start the dev server: npm run dev\n');
}

setupDatabase().catch((err) => {
  console.error('❌  Setup failed:', err.message);
  process.exit(1);
});
