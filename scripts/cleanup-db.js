// One-time cleanup: delete all sessions that have 0 chunks in DB
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

const sessions = await sql`SELECT id, filename FROM pdf_sessions`;
let deleted = 0;
for (const s of sessions) {
  const count = await sql`SELECT COUNT(*) as n FROM pdf_chunks WHERE session_id = ${s.id}`;
  if (parseInt(count[0].n) === 0) {
    await sql`DELETE FROM pdf_sessions WHERE id = ${s.id}`;
    console.log(`🗑️  Deleted empty session: "${s.filename}" (${s.id.slice(0,8)}...)`);
    deleted++;
  }
}
console.log(`\n✅  Cleaned ${deleted} empty session(s). Database is ready for fresh uploads.`);
