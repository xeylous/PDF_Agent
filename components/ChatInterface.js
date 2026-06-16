'use client';

/**
 * components/ChatInterface.js
 * The "Scholar's Dossier" — a revolutionary chat interface.
 *
 * Layout:
 *  ┌─ Sidebar ─────────────────┬─ Dossier Area ─────────────────────────────┐
 *  │  Document card            │  Scrollable Q&A entries                    │
 *  │  Session stats            │  Each entry: Query Stamp + Response Scroll  │
 *  │  Quick prompts            │  Input: Inkwell text field + wax seal send  │
 *  └───────────────────────────┴────────────────────────────────────────────┘
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import MessageItem from '@/components/MessageItem.js';

const QUICK_PROMPTS = [
  'Summarize the key findings',
  'What are the main topics?',
  'List the most important points',
  'What conclusions are drawn?',
];

export default function ChatInterface({ session }) {
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [inputRows, setInputRows]   = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const abortRef       = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const lines = input.split('\n').length;
    setInputRows(Math.min(Math.max(lines, 1), 4));
  }, [input]);

  // ── Submit Handler ──────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (questionText) => {
    const question = (questionText ?? input).trim();
    if (!question || isLoading) return;

    setInput('');
    setIsLoading(true);

    // Add user question + empty streaming answer slot
    const msgId = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: msgId, question, answer: '', sources: [], isStreaming: true, isError: false },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sessionId: session.sessionId, question }),
      });

      if (!response.ok || !response.body) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? 'Server error. Please try again.');
      }

      // Stream the response
      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.error) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === msgId
                    ? { ...m, answer: data.error, isStreaming: false, isError: true }
                    : m
                )
              );
              break;
            }

            if (data.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === msgId ? { ...m, answer: m.answer + data.text } : m
                )
              );
            }

            if (data.done) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === msgId
                    ? { ...m, sources: data.sources ?? [], isStreaming: false }
                    : m
                )
              );
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }

    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, answer: err.message, isStreaming: false, isError: true }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, isLoading, session.sessionId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden w-full relative" style={{ minHeight: 0 }}>
      {/* Backdrop overlay for mobile drawer */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#3a2928]/40 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ══ Left Sidebar ══════════════════════════════════════════════════════ */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto flex flex-col gap-4 p-4 flex-shrink-0 transition-transform duration-300 ease-in-out h-full lg:h-auto sketch-border-alt
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-[275px] lg:w-[265px]`}
        style={{
          backgroundColor: 'rgba(252, 247, 242, 0.85)', // warm paper glass
          backdropFilter: 'blur(16px)',
          borderColor: '#ab947e',
          boxShadow: isSidebarOpen 
            ? '8px 0 24px rgba(111, 94, 83, 0.15)' 
            : '4px 4px 10px rgba(111, 94, 83, 0.05), -4px -4px 10px #ffffff',
        }}
      >
        {/* Mobile Header with Close button */}
        <div className="flex items-center justify-between lg:hidden pb-3 mb-1 border-b" style={{ borderColor: 'rgba(154,122,106,0.2)' }}>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#3e2826' }}>
            Document Panel
          </span>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center justify-center w-7 h-7 rounded-full transition-all"
            style={{
              backgroundColor: 'rgba(252, 247, 242, 0.9)',
              boxShadow: '2px 2px 4px rgba(111, 94, 83, 0.1), -2px -2px 4px #ffffff',
              color: '#3e2826',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Document Card */}
        <div
          className="p-4 sketch-border-sm"
          style={{
            backgroundColor: 'rgba(252, 247, 242, 0.65)',
            borderColor: 'rgba(171, 148, 126, 0.4)',
            boxShadow: 'inset 2px 2px 5px rgba(111, 94, 83, 0.1), inset -2px -2px 5px #ffffff',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="flex items-center justify-center w-8 h-8 sketch-border-sm"
              style={{
                backgroundColor: 'rgba(252, 247, 242, 0.85)',
                borderColor: '#ab947e',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                  stroke="#6f5e53"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#6f5e53" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: '#8a7968' }}
            >
              Active Document
            </span>
          </div>

          <p
            className="text-sm font-semibold mb-3 leading-snug break-all"
            style={{ fontFamily: "'Playfair Display', serif", color: '#3e2826' }}
          >
            {session.filename}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Pages',   value: session.pages      },
              { label: 'Chunks',  value: session.chunkCount },
              { label: 'Queries', value: messages.length    },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="p-1.5 text-center sketch-border-sm"
                style={{
                  backgroundColor: 'rgba(252, 247, 242, 0.85)',
                  borderColor: 'rgba(111, 94, 83, 0.25)',
                  boxShadow: '1px 1px 3px rgba(111, 94, 83, 0.05)',
                }}
              >
                <p className="text-sm font-bold" style={{ color: '#3e2826' }}>
                  {value ?? '—'}
                </p>
                <p className="text-[10px] font-medium" style={{ color: '#8a7968' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Cached badge */}
          {session.cached && (
            <div
              className="mt-3 flex items-center gap-1.5 px-2 py-1 rounded-lg"
              style={{
                backgroundColor: 'rgba(252, 247, 242, 0.4)',
                border: '1px solid rgba(171, 148, 126, 0.2)',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#8a7968" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-[11px] font-medium" style={{ color: '#8a7968' }}>
                Embeddings cached
              </span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div
          className="p-4 sketch-border-sm flex-1 flex flex-col gap-2"
          style={{
            backgroundColor: 'rgba(252, 247, 242, 0.65)',
            borderColor: 'rgba(171, 148, 126, 0.4)',
            boxShadow: 'inset 2px 2px 5px rgba(111, 94, 83, 0.1), inset -2px -2px 5px #ffffff',
            minHeight: '220px',
          }}
        >
          <p
            className="text-xs font-bold uppercase tracking-wider mb-1"
            style={{ color: '#8a7968' }}
          >
            Quick Queries
          </p>
          <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => {
                  handleSubmit(prompt);
                  setIsSidebarOpen(false); // close sidebar drawer on mobile
                }}
                disabled={isLoading}
                className="text-left text-[11px] leading-tight py-2 px-2.5 sketch-border-sm transition-all duration-150 disabled:opacity-40 select-none"
                style={{
                  backgroundColor: 'rgba(252, 247, 242, 0.85)',
                  borderColor: '#ab947e',
                  boxShadow: '2px 2px 5px rgba(111, 94, 83, 0.08), -2px -2px 5px #ffffff',
                  color: '#3e2826',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => !isLoading && (e.currentTarget.style.boxShadow = 'inset 1.5px 1.5px 3px rgba(111, 94, 83, 0.1), inset -1.5px -1.5px 3px #ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '2px 2px 5px rgba(111, 94, 83, 0.08), -2px -2px 5px #ffffff')}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ══ Main Dossier Area ══════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Mobile Sub-Header (Only visible on screens < lg) */}
        <div
          className="lg:hidden flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0"
          style={{
            backgroundColor: 'rgba(252, 247, 242, 0.72)', // warm paper glass
            backdropFilter: 'blur(10px)',
            borderColor: 'rgba(111, 94, 83, 0.25)',
          }}
        >
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 sketch-border-sm text-xs font-semibold select-none"
            style={{
              backgroundColor: 'rgba(252, 247, 242, 0.9)',
              boxShadow: '2px 2px 5px rgba(111, 94, 83, 0.1), -2px -2px 5px #ffffff',
              color: '#3e2826',
              cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            Stats & Info
          </button>

          <span
            className="text-xs font-semibold truncate max-w-[170px]"
            style={{ color: '#6f5e53' }}
            title={session.filename}
          >
            {session.filename}
          </span>
        </div>

        {/* ── Message List ──────────────────────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto px-4 py-6 space-y-8"
          id="dossier-scroll"
        >
          {messages.length === 0 ? (
            <EmptyState onPrompt={handleSubmit} isLoading={isLoading} />
          ) : (
            messages.map((msg, i) => (
              <div key={msg.id}>
                <MessageItem message={msg} index={i} />
                {i < messages.length - 1 && (
                  <div className="entry-divider mt-8" />
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Area — Inkwell ──────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 p-2.5 sm:p-4 border-t-2"
          style={{
            backgroundColor: 'rgba(242, 231, 222, 0.7)', // warm paper glass
            backdropFilter: 'blur(10px)',
            borderColor: '#ab947e',
            boxShadow: '0 -6px 20px rgba(111, 94, 83, 0.1)',
          }}
        >
          <div
            className="flex items-end gap-2.5 sm:gap-3 max-w-3xl mx-auto p-2 sm:p-3 sketch-border-alt"
            style={{
              backgroundColor: 'rgba(252, 247, 242, 0.85)',
              borderColor: '#6f5e53',
              boxShadow: '4px 4px 12px rgba(111, 94, 83, 0.12), -4px -4px 12px #ffffff',
            }}
          >
            {/* Inkwell icon */}
            <div
              className="flex items-center justify-center w-9 h-9 sketch-border-sm flex-shrink-0 mb-0.5"
              style={{
                backgroundColor: 'rgba(252, 247, 242, 0.9)',
                borderColor: 'rgba(111, 94, 83, 0.4)',
                boxShadow: 'inset 1.5px 1.5px 3px rgba(111, 94, 83, 0.1), inset -1.5px -1.5px 3px #ffffff',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                  stroke="#3e2826"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Textarea */}
            <textarea
              ref={inputRef}
              id="chat-input"
              className="chat-input flex-1"
              rows={inputRows}
              placeholder="Ask anything about the document…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              style={{
                minHeight: '44px',
                maxHeight: '120px',
                padding: '10px 12px',
                border: 'none',
                backgroundColor: 'transparent',
                boxShadow: 'none',
              }}
              aria-label="Question input"
            />

            {/* Wax Seal Send Button */}
            <button
              id="chat-send-btn"
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading}
              className="flex items-center justify-center w-10 h-10 sketch-seal flex-shrink-0 transition-all duration-150 mb-0.5"
              style={{
                backgroundColor: !input.trim() || isLoading ? 'rgba(111, 94, 83, 0.15)' : 'rgba(139, 58, 58, 0.85)',
                color: !input.trim() || isLoading ? '#8a7968' : '#fcfaf7',
                borderColor: !input.trim() || isLoading ? 'rgba(111, 94, 83, 0.25)' : '#602222',
                boxShadow:
                  !input.trim() || isLoading
                    ? 'inset 2px 2px 4px rgba(0,0,0,0.1)'
                    : '3px 3px 6px rgba(0,0,0,0.25), inset -1.5px -1.5px 4px rgba(0,0,0,0.3), inset 1.5px 1.5px 4px rgba(255,255,255,0.25)',
                cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                borderStyle: 'solid',
                borderWidth: '1.5px',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'rgba(139, 58, 58, 0.95)';
                  e.currentTarget.style.transform = 'scale(1.03)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'rgba(139, 58, 58, 0.85)';
                  e.currentTarget.style.transform = 'none';
                }
              }}
              aria-label="Send question"
            >
              {isLoading ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ animation: 'spin-slow 2s linear infinite' }}
                >
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2.2" opacity="0.35" />
                  <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Hint */}
          <p className="hidden sm:block text-center text-xs mt-2" style={{ color: '#ab947e' }}>
            Press <kbd
              className="px-1.5 py-0.5 rounded text-xs mx-0.5"
              style={{
                backgroundColor: '#c3a995',
                boxShadow: '1px 1px 3px #9a7a6a, -1px -1px 3px #d8c4b6',
                color: '#6f5e53',
                fontFamily: 'monospace',
              }}
            >Enter</kbd>
            to submit · <kbd
              className="px-1.5 py-0.5 rounded text-xs mx-0.5"
              style={{
                backgroundColor: '#c3a995',
                boxShadow: '1px 1px 3px #9a7a6a, -1px -1px 3px #d8c4b6',
                color: '#6f5e53',
                fontFamily: 'monospace',
              }}
            >Shift+Enter</kbd> for new line
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onPrompt, isLoading }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
      {/* Large decorative icon */}
      <div
        className="flex items-center justify-center w-24 h-24 rounded-3xl mb-8"
        style={{
          backgroundColor: '#c3a995',
          boxShadow: '10px 10px 20px #9a7a6a, -10px -10px 20px #d8c4b6',
        }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
            stroke="#6f5e53"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M8 10h8M8 14h5" stroke="#8a7968" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <h2
        className="text-2xl font-semibold mb-2"
        style={{ fontFamily: "'Playfair Display', serif", color: '#3a2928' }}
      >
        Begin your inquiry
      </h2>
      <p className="text-sm max-w-sm mb-8" style={{ color: '#8a7968' }}>
        The document is indexed and ready. Ask anything — the scholar will find answers from your PDF.
      </p>

      {/* Suggestion pills */}
      <div className="flex flex-wrap justify-center gap-2 max-w-md">
        {[
          'What is this document about?',
          'List the key conclusions',
          'Explain the main concepts',
        ].map((s) => (
          <button
            key={s}
            onClick={() => onPrompt(s)}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-sm transition-all duration-150 disabled:opacity-40"
            style={{
              backgroundColor: '#c3a995',
              boxShadow: '4px 4px 8px #9a7a6a, -4px -4px 8px #d8c4b6',
              color: '#593d3b',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.boxShadow = 'inset 3px 3px 6px #9a7a6a, inset -3px -3px 6px #d8c4b6')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '4px 4px 8px #9a7a6a, -4px -4px 8px #d8c4b6')}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
