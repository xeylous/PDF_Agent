'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      className="w-full mt-auto border-t-2 px-4 py-6 sm:px-6 sm:py-8"
      style={{
        backgroundColor: 'rgba(62, 40, 38, 0.96)', // rich leather-espresso back cover
        borderColor: '#3e2826',
        borderRadius: '18px 15px 0 0 / 15px 12px 0 0', // wobbly leather cut top
        boxShadow: '0 -8px 32px rgba(62, 40, 38, 0.15)',
        color: '#fcfaf7',
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* ── Brand & Description ────────────────────────────────────────── */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1">
          <div className="flex items-center gap-2">
            {/* Sketchy logo box */}
            <div
              className="flex items-center justify-center w-7 h-7 sketch-border-sm"
              style={{
                backgroundColor: 'rgba(242, 231, 222, 0.15)',
                borderColor: '#ab947e',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                  stroke="#fcfaf7"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <span
              className="text-sm font-bold tracking-wider"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              PDF Scholar
            </span>
          </div>
          <p className="text-[11px]" style={{ color: '#ab947e' }}>
            Document Intelligence & Semantic RAG Engine
          </p>
        </div>

        {/* ── Scholarly Quote ──────────────────────────────────────────────── */}
        <div className="hidden lg:block text-center max-w-sm italic text-xs leading-relaxed" style={{ color: '#ab947e', fontFamily: "'Playfair Display', serif" }}>
          &ldquo;Knowledge is the treasure, but judgment is the treasurer of a wise man.&rdquo;
          <span className="block mt-0.5 text-[10px] font-semibold tracking-wider uppercase" style={{ color: '#6f5e53' }}>
            &mdash; The Scholar&apos;s Ledger
          </span>
        </div>

        {/* ── Navigation Links ────────────────────────────────────────────── */}
        <div className="flex flex-col items-center md:items-end gap-2.5">
          <div className="flex items-center gap-4 text-xs font-bold" style={{ color: '#fcfaf7' }}>
            <Link
              href="/"
              className="hover:underline transition-all"
              style={{ color: '#ab947e' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fcfaf7'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#ab947e'}
            >
              Workspace
            </Link>
            <span style={{ color: '#6f5e53' }}>•</span>
            <Link
              href="/how-it-works"
              className="hover:underline transition-all"
              style={{ color: '#ab947e' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fcfaf7'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#ab947e'}
            >
              Ledger Mechanics
            </Link>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center md:justify-end">
            {['Groq Llama-3.3', 'Gemini Embeddings', 'Neon pgvector'].map((tech) => (
              <span
                key={tech}
                className="text-[9px] px-2 py-0.5 rounded font-bold"
                style={{
                  backgroundColor: 'rgba(242, 231, 222, 0.06)',
                  color: '#ab947e',
                  border: '1px solid rgba(171, 148, 126, 0.25)',
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* ── Bottom Strip ────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto mt-6 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px]" style={{ borderColor: 'rgba(171, 148, 126, 0.15)', color: '#ab947e' }}>
        <p className="font-medium text-center sm:text-left">
          &copy; {new Date().getFullYear()} PDF Scholar. Formulated for precise text retrieval.
        </p>
        <p className="font-semibold" style={{ color: '#6f5e53' }}>
          EX LIBRIS • DEEP DOCUMENT STUDY
        </p>
      </div>
    </footer>
  );
}
