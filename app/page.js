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
import Footer         from '@/components/Footer.js';

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
  const handleNewDocument = async () => {
    const currentSessionId = session?.sessionId;

    // Reset local states immediately for instant UI feedback
    setSession(null);
    setView('upload');
    try {
      sessionStorage.removeItem('pdfScholar.session');
    } catch {}

    // Clean up database records (embeddings and vectors) in background
    if (currentSessionId) {
      try {
        await fetch(`/api/session?sessionId=${currentSessionId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to clear database session:', err);
      }
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col w-full"
      style={{
        height: view === 'chat' ? '100vh' : 'auto',
        minHeight: '100vh',
        backgroundColor: 'transparent',
        overflow: view === 'chat' ? 'hidden' : 'auto',
      }}
    >
      {/* ── App Header ─────────────────────────────────────────────────── */}
      <Header
        session={session}
        onNewDocument={handleNewDocument}
      />

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <div className={`flex-1 ${view === 'chat' ? 'overflow-hidden' : 'overflow-y-auto'}`}>

        {/* Upload View */}
        {view === 'upload' && (
          <div className="min-h-[calc(100vh-80px)] flex flex-col justify-between">
            <div className="flex-1 flex flex-col items-center justify-center gap-6 sm:gap-8 px-4 py-6 sm:py-12">
              {/* Hero text */}
              <div className="text-center max-w-xl px-2">
                <h2
                  className="text-3xl sm:text-4xl font-semibold mb-3 leading-tight"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: '#3e2826',
                  }}
                >
                  Interrogate any PDF
                  <br />
                  <span style={{ color: '#6f5e53' }}>with precision</span>
                </h2>
                <p className="text-sm sm:text-base" style={{ color: '#8a7968', lineHeight: 1.7 }}>
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
                    className="flex flex-col items-center px-4 py-2.5 sketch-border-sm"
                    style={{
                      backgroundColor: 'rgba(252, 247, 242, 0.72)',
                      boxShadow: '2px 2px 5px rgba(111, 94, 83, 0.08), -2px -2px 5px #ffffff',
                      minWidth: '95px',
                    }}
                  >
                    <span
                      className="text-xs font-semibold"
                      style={{ color: 'var(--espresso)' }}
                    >
                      {name}
                    </span>
                    <span className="text-xs font-medium" style={{ color: 'var(--olive)' }}>
                      {sub}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Footer />
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
