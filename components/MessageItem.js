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
      <div className="flex items-start gap-3 mb-3">
        {/* Entry badge */}
        <div className="entry-badge mt-1 flex-shrink-0">
          {String(index + 1).padStart(2, '0')}
        </div>

        {/* Query Stamp — neumorphic inset */}
        <div className="query-stamp flex-1 px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            {/* Seal icon */}
            <div
              className="flex items-center justify-center w-5 h-5 rounded-full"
              style={{
                backgroundColor: '#c3a995',
                boxShadow: '2px 2px 4px #9a7a6a, -2px -2px 4px #d8c4b6',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="#8a7968" />
                <path
                  d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  stroke="#8a7968"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: '#8a7968' }}
            >
              Query
            </span>
          </div>
          <p
            className="text-base leading-relaxed"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#3a2928',
              fontStyle: 'italic',
            }}
          >
            {question}
          </p>
        </div>
      </div>

      {/* ── Connector Line ──────────────────────────────────────────────────── */}
      <div className="ml-[52px] mb-3 flex items-center gap-2">
        <div style={{ width: '1px', height: '16px', backgroundColor: '#ab947e', opacity: 0.4 }} />
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path
            d="M19 9l-7 7-7-7"
            stroke="#ab947e"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.5"
          />
        </svg>
      </div>

      {/* ── Response Scroll — neumorphic raised ─────────────────────────────── */}
      <div className="ml-[52px]">
        <div className="response-scroll px-6 py-5">

          {/* Response header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {/* AI icon */}
              <div
                className="flex items-center justify-center w-6 h-6 rounded-lg"
                style={{
                  backgroundColor: '#c3a995',
                  boxShadow: '2px 2px 4px #9a7a6a, -2px -2px 4px #d8c4b6',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="#6f5e53"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: '#8a7968' }}
              >
                Response
              </span>
            </div>

            {/* Model tag */}
            <span
              className="text-xs px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: '#c3a995',
                boxShadow: 'inset 1px 1px 3px #9a7a6a, inset -1px -1px 3px #d8c4b6',
                color: '#8a7968',
                fontWeight: 500,
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
            <p className="text-sm" style={{ color: '#7a5e52' }}>
              {answer || 'An error occurred. Please try again.'}
            </p>
          ) : (
            <div className={`prose-scholar ${isStreaming ? 'ink-cursor' : ''}`}>
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
          )}

          {/* ── Source Footnotes ─────────────────────────────────────────── */}
          {!isStreaming && sources && sources.length > 0 && (
            <div className="mt-5 pt-4 border-t" style={{ borderColor: 'rgba(154,122,106,0.2)' }}>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: '#8a7968' }}
              >
                Sources Retrieved
              </p>
              <div className="flex flex-wrap gap-2">
                {sources.map((source) => (
                  <div key={source.id} className="relative">
                    <button
                      className="source-chip animate-source-fade"
                      onClick={() =>
                        setExpandedSource(expandedSource === source.id ? null : source.id)
                      }
                      aria-expanded={expandedSource === source.id}
                    >
                      <span
                        className="flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold"
                        style={{ backgroundColor: '#6f5e53', color: '#e5d4cb' }}
                      >
                        {source.id}
                      </span>
                      SOURCE {source.id}
                      <span style={{ color: '#ab947e' }}>
                        {(source.similarity * 100).toFixed(0)}%
                      </span>
                    </button>

                    {/* Source content tooltip */}
                    {expandedSource === source.id && (
                      <div
                        className="absolute bottom-full left-0 mb-2 p-3 rounded-xl z-10 w-72 text-xs leading-relaxed animate-slide-up"
                        style={{
                          backgroundColor: '#c3a995',
                          boxShadow: '6px 6px 14px #9a7a6a, -6px -6px 14px #d8c4b6',
                          color: '#593d3b',
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        <p
                          className="font-semibold mb-1.5 text-xs uppercase tracking-wider"
                          style={{ color: '#8a7968' }}
                        >
                          Source {source.id} — Excerpt
                        </p>
                        <p style={{ color: '#6f5e53' }}>{source.content}</p>
                        <button
                          className="mt-2 text-xs font-medium"
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
