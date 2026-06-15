import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

const sessions = await sql`SELECT id, filename, chunk_count, created_at FROM pdf_sessions ORDER BY created_at DESC`;
console.log('Sessions:', JSON.stringify(sessions, null, 2));

for (const s of sessions) {
  const count = await sql`SELECT COUNT(*) as n FROM pdf_chunks WHERE session_id = ${s.id}`;
  console.log(`  Session ${s.id.slice(0,8)}... "${s.filename}": ${count[0].n} chunks in DB`);
}
