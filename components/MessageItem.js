'use client';

/**
 * components/MessageItem.js
 * Renders a single Q&A "dossier entry" in the Scholar's Dossier chat UI.
 *
 * Layout:
 *  ┌── Entry number badge ──────────────────────────────────────────┐
 *  │  [QUERY STAMP] — neumorphic inset, user question               │
 *  │  [RESPONSE SCROLL] — neumorphic raised, streaming AI answer    │
 *  │  [SOURCE FOOTNOTES] — fade in after streaming completes        │
 *  └────────────────────────────────────────────────────────────────┘
 */
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function MessageItem({ message, index }) {
  const { question, answer, sources, isStreaming, isError } = message;
  const [expandedSource, setExpandedSource] = useState(null);

  return (
    <div className="animate-slide-up w-full">

      {/* ── Entry Number Badge + Query Stamp ───────────────────────────────── */}
      <div className="flex items-start gap-2.5 sm:gap-3 mb-3">
        {/* Entry badge */}
        <div className="entry-badge mt-1 flex-shrink-0 select-none">
          {String(index + 1).padStart(2, '0')}
        </div>

        {/* Query Stamp — wobbly ink-stamped card */}
        <div className="flex-1 px-4 py-3.5 sm:px-5 sm:py-4 sketch-border"
          style={{
            backgroundColor: 'rgba(171, 148, 126, 0.12)', // sepia ink wash
            borderColor: '#ab947e',
            boxShadow: 'inset 2.5px 2.5px 6px rgba(111, 94, 83, 0.18)',
            animation: 'stamp-in 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <div className="flex items-center gap-2 mb-2 select-none">
            {/* Seal icon */}
            <div
              className="flex items-center justify-center w-5 h-5 rounded-full"
              style={{
                backgroundColor: 'rgba(252, 247, 242, 0.85)',
                boxShadow: '1.5px 1.5px 3px rgba(111, 94, 83, 0.2)',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="#8a7968" />
                <path
                  d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  stroke="#8a7968"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: '#8a7968' }}
            >
              Query
            </span>
          </div>
          <p
            className="text-base leading-relaxed font-medium"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#3e2826',
              fontStyle: 'italic',
            }}
          >
            {question}
          </p>
        </div>
      </div>

      {/* ── Connector Line ──────────────────────────────────────────────────── */}
      <div className="ml-9 sm:ml-[52px] mb-3 flex items-center gap-2 select-none">
        <div style={{ width: '1px', height: '16px', backgroundColor: '#ab947e', opacity: 0.4 }} />
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path
            d="M19 9l-7 7-7-7"
            stroke="#ab947e"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.55"
          />
        </svg>
      </div>

      {/* ── Response Scroll — parchment / glass scroll ─────────────────────── */}
      <div className="ml-9 sm:ml-[52px]">
        <div
          className="sketch-border-alt px-4 py-4 sm:px-6 sm:py-5"
          style={{
            backgroundColor: 'rgba(252, 247, 242, 0.88)', // warm parchment glass
            backdropFilter: 'blur(8px)',
            borderColor: '#ab947e',
            boxShadow: '4px 4px 15px rgba(111, 94, 83, 0.1), -4px -4px 15px #ffffff',
            animation: 'unfurl 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
            transformOrigin: 'top center',
          }}
        >
          {/* Response header */}
          <div className="flex items-center justify-between mb-4 select-none">
            <div className="flex items-center gap-2">
              {/* AI icon */}
              <div
                className="flex items-center justify-center w-6 h-6 sketch-border-sm"
                style={{
                  backgroundColor: 'rgba(252, 247, 242, 0.95)',
                  borderColor: 'rgba(111, 94, 83, 0.5)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="#6f5e53"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: '#8a7968' }}
              >
                Response
              </span>
            </div>

            {/* Model tag */}
            <span
              className="text-xs px-2 py-0.5 sketch-border-sm font-semibold"
              style={{
                backgroundColor: 'rgba(252, 247, 242, 0.5)',
                borderColor: 'rgba(111, 94, 83, 0.35)',
                color: '#8a7968',
              }}
            >
              llama-3.3-70b
            </span>
          </div>

          {/* ── Content ──────────────────────────────────────────────────── */}
          {isStreaming && answer === '' ? (
            /* Thinking indicator */
            <ThinkingIndicator />
          ) : isError ? (
            <p className="text-sm font-medium" style={{ color: '#8b3a3a' }}>
              {answer || 'An error occurred. Please try again.'}
            </p>
          ) : (
            <div className={`prose-scholar ${isStreaming ? 'ink-cursor' : ''}`}>
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
          )}

          {/* ── Source Footnotes ─────────────────────────────────────────── */}
          {!isStreaming && sources && sources.length > 0 && (
            <div className="mt-5 pt-4 border-t" style={{ borderColor: 'rgba(111, 94, 83, 0.2)' }}>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-3 select-none"
                style={{ color: '#8a7968' }}
              >
                Sources Retrieved
              </p>
              <div className="flex flex-wrap gap-2">
                {sources.map((source) => (
                  <div key={source.id} className="relative">
                    <button
                      className="source-chip animate-source-fade sketch-border-sm select-none"
                      style={{
                        backgroundColor: 'rgba(252, 247, 242, 0.9)',
                        borderColor: '#ab947e',
                        boxShadow: '2px 2px 5px rgba(111, 94, 83, 0.08), -2px -2px 5px #ffffff',
                      }}
                      onClick={() =>
                        setExpandedSource(expandedSource === source.id ? null : source.id)
                      }
                      aria-expanded={expandedSource === source.id}
                    >
                      <span
                        className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: '#6f5e53', color: '#fcfaf7' }}
                      >
                        {source.id}
                      </span>
                      SOURCE {source.id}
                      <span style={{ color: '#ab947e' }} className="font-semibold">
                        {(source.similarity * 100).toFixed(0)}%
                      </span>
                    </button>

                    {/* Source content tooltip */}
                    {expandedSource === source.id && (
                      <div
                        className="absolute bottom-full left-0 mb-2 p-3 z-10 w-72 max-w-[calc(100vw-80px)] text-xs leading-relaxed animate-slide-up sketch-border-sm"
                        style={{
                          backgroundColor: 'rgba(252, 247, 242, 0.95)',
                          backdropFilter: 'blur(12px)',
                          borderColor: '#ab947e',
                          color: '#3e2826',
                          boxShadow: '4px 4px 12px rgba(111, 94, 83, 0.15)',
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        <p
                          className="font-bold mb-1.5 text-xs uppercase tracking-wider"
                          style={{ color: '#8a7968' }}
                        >
                          Source {source.id} — Excerpt
                        </p>
                        <p className="font-medium" style={{ color: '#6f5e53' }}>{source.content}</p>
                        <button
                          className="mt-2 text-xs font-semibold"
                          style={{ color: '#ab947e' }}
                          onClick={() => setExpandedSource(null)}
                        >
                          Close ×
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Thinking Indicator ────────────────────────────────────────────────────────
function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-4 py-2">
      {/* Ink drops */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="ink-drop-dot"
            style={{
              animationName: 'ink-drop',
              animationDuration: '1.4s',
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDelay: `${i * 0.22}s`,
            }}
          />
        ))}
      </div>
      <span
        className="text-xs"
        style={{ color: '#8a7968', fontStyle: 'italic' }}
      >
        Consulting the document…
      </span>
    </div>
  );
}
