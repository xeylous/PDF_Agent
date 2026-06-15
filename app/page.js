'use client';

/**
 * app/page.js
 * Main application page — orchestrates the upload → chat state machine.
 *
 * States:
 *   'upload'  → Show UploadZone centered on page
 *   'chat'    → Show ChatInterface with sidebar + dossier
 *
 * Session data is also persisted in sessionStorage so page refreshes
 * don't lose the active document (within the same browser tab).
 */
import { useState, useEffect } from 'react';
import Header         from '@/components/Header.js';
import UploadZone     from '@/components/UploadZone.js';
import ChatInterface  from '@/components/ChatInterface.js';

export default function HomePage() {
  const [view, setView]       = useState('upload'); // 'upload' | 'chat'
  const [session, setSession] = useState(null);

  // ── Restore session from sessionStorage on mount ───────────────────────
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('pdfScholar.session');
      if (saved) {
        const data = JSON.parse(saved);
        setSession(data);
        setView('chat');
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // ── Handle successful upload ───────────────────────────────────────────
  const handleUploadSuccess = (data) => {
    setSession(data);
    setView('chat');
    try {
      sessionStorage.setItem('pdfScholar.session', JSON.stringify(data));
    } catch {
      // sessionStorage may not be available in all environments
    }
  };

  // ── Handle "New Document" ──────────────────────────────────────────────
  const handleNewDocument = () => {
    setSession(null);
    setView('upload');
    try {
      sessionStorage.removeItem('pdfScholar.session');
    } catch {}
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col"
      style={{ height: '100vh', backgroundColor: '#c3a995', overflow: 'hidden' }}
    >
      {/* ── App Header ─────────────────────────────────────────────────── */}
      <Header
        session={session}
        onNewDocument={handleNewDocument}
      />

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">

        {/* Upload View */}
        {view === 'upload' && (
          <div className="h-full flex flex-col items-center justify-center gap-8 px-4 py-8">
            {/* Hero text */}
            <div className="text-center max-w-xl">
              <h2
                className="text-4xl font-semibold mb-3 leading-tight"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: '#3a2928',
                }}
              >
                Interrogate any PDF
                <br />
                <span style={{ color: '#6f5e53' }}>with precision</span>
              </h2>
              <p className="text-base" style={{ color: '#8a7968', lineHeight: 1.7 }}>
                Upload a document and ask questions in plain language.
                Semantic search surfaces the most relevant excerpts,
                Groq&apos;s LLM synthesizes a precise answer.
              </p>
            </div>

            {/* Upload Zone */}
            <UploadZone onSuccess={handleUploadSuccess} />

            {/* Tech stack */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {[
                { name: 'Groq LLM',    sub: 'llama-3.3-70b'       },
                { name: 'Gemini',      sub: 'Embeddings'           },
                { name: 'Neon DB',     sub: 'pgvector'             },
                { name: 'Next.js 15',  sub: 'Streaming'            },
              ].map(({ name, sub }) => (
                <div
                  key={name}
                  className="flex flex-col items-center px-4 py-2.5 rounded-2xl"
                  style={{
                    backgroundColor: '#c3a995',
                    boxShadow: '4px 4px 8px #9a7a6a, -4px -4px 8px #d8c4b6',
                    minWidth: '90px',
                  }}
                >
                  <span
                    className="text-xs font-semibold"
                    style={{ color: '#593d3b' }}
                  >
                    {name}
                  </span>
                  <span className="text-xs" style={{ color: '#8a7968' }}>
                    {sub}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat View */}
        {view === 'chat' && session && (
          <ChatInterface session={session} />
        )}
      </div>
    </div>
  );
}
