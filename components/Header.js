'use client';

/**
 * components/Header.js
 * App header — dark espresso bar with app branding and optional action slot.
 */

export default function Header({ session, onNewDocument }) {
  return (
    <header
      className="w-full flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4"
      style={{
        backgroundColor: '#593d3b',
        boxShadow: '0 4px 20px rgba(89, 61, 59, 0.4)',
      }}
    >
      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Neumorphic icon container */}
        <div
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl"
          style={{
            backgroundColor: '#6f5e53',
            boxShadow: '3px 3px 6px #3a2928, -2px -2px 5px #7a6a5f',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="sm:w-5 sm:h-5">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
              stroke="#c3a995"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
              stroke="#c3a995"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div>
          <h1
            className="text-base sm:text-lg font-semibold tracking-wide leading-none"
            style={{ fontFamily: "'Playfair Display', serif", color: '#e5d4cb' }}
          >
            PDF Scholar
          </h1>
          <p className="hidden sm:block text-xs mt-0.5" style={{ color: '#9a7a6a' }}>
            Document Intelligence
          </p>
        </div>
      </div>

      {/* ── Session Info + Action ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {session && (
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: '#6f5e53',
              boxShadow: 'inset 2px 2px 4px #3a2928, inset -2px -2px 4px #7a6a5f',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="#8a7968"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="text-xs font-medium truncate max-w-[160px]"
              style={{ color: '#ab947e' }}
              title={session.filename}
            >
              {session.filename}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: '#593d3b', color: '#8a7968' }}
            >
              {session.pages}p
            </span>
          </div>
        )}

        {session && (
          <button
            onClick={onNewDocument}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150"
            style={{
              backgroundColor: '#6f5e53',
              color: '#c3a995',
              boxShadow: '3px 3px 6px #3a2928, -2px -2px 5px #7a6a5f',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'inset 2px 2px 4px #3a2928, inset -2px -2px 4px #7a6a5f';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '3px 3px 6px #3a2928, -2px -2px 5px #7a6a5f';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.boxShadow = 'inset 3px 3px 6px #3a2928, inset -2px -2px 5px #7a6a5f';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.boxShadow = '3px 3px 6px #3a2928, -2px -2px 5px #7a6a5f';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 4v16m8-8H4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="hidden sm:inline">New Document</span>
            <span className="inline sm:hidden">New</span>
          </button>
        )}

        {/* Model badges */}
        <div className="hidden md:flex items-center gap-1.5">
          {['Groq', 'Gemini', 'Neon'].map((label) => (
            <span
              key={label}
              className="text-xs px-2 py-0.5 rounded-md font-medium"
              style={{
                backgroundColor: '#4a3230',
                color: '#8a7968',
                letterSpacing: '0.03em',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
