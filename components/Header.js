'use client';

/**
 * components/Header.js
 * App header — dark espresso bar with app branding and optional action slot.
 */

export default function Header({ session, onNewDocument }) {
  return (
    <header
      className="w-full flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b-2"
      style={{
        backgroundColor: 'rgba(62, 40, 38, 0.94)', // rich leather-espresso cover
        backdropFilter: 'blur(12px)',
        borderColor: '#3e2826',
        borderRadius: '0 0 16px 18px / 0 0 12px 15px', // wobbly leather cut bottom
        boxShadow: '0 8px 32px rgba(62, 40, 38, 0.15), 4px 4px 10px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Sketchy glass icon container */}
        <div
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 sketch-border-sm"
          style={{
            backgroundColor: 'rgba(242, 231, 222, 0.18)',
            borderColor: '#ab947e',
            boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.2), 2px 2px 4px rgba(255,255,255,0.05)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="sm:w-5 sm:h-5">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
              stroke="#f2e7de"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
              stroke="#f2e7de"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div>
          <h1
            className="text-base sm:text-lg font-semibold tracking-wide leading-none"
            style={{ fontFamily: "'Playfair Display', serif", color: '#fcfaf7' }}
          >
            PDF Scholar
          </h1>
          <p className="hidden sm:block text-xs mt-0.5 font-medium" style={{ color: '#ab947e', letterSpacing: '0.04em' }}>
            Document Intelligence
          </p>
        </div>
      </div>

      {/* ── Session Info + Action ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {session && (
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 sketch-border-sm"
            style={{
              backgroundColor: 'rgba(242, 231, 222, 0.12)',
              borderColor: 'rgba(171, 148, 126, 0.5)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="#ab947e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="text-xs font-semibold truncate max-w-[160px]"
              style={{ color: '#fcfaf7' }}
              title={session.filename}
            >
              {session.filename}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded font-bold"
              style={{ backgroundColor: '#3e2826', color: '#ab947e' }}
            >
              {session.pages}p
            </span>
          </div>
        )}

        {session && (
          <button
            onClick={onNewDocument}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 sketch-seal text-xs sm:text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: 'rgba(139, 58, 58, 0.85)', // rich crimson wax seal
              color: '#fcfaf7',
              borderColor: '#602222',
              boxShadow: '3px 3px 8px rgba(0,0,0,0.3), inset -2px -2px 6px rgba(0,0,0,0.4), inset 2px 2px 6px rgba(255,255,255,0.3)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.04)';
              e.currentTarget.style.backgroundColor = 'rgba(139, 58, 58, 0.95)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.backgroundColor = 'rgba(139, 58, 58, 0.85)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.boxShadow = 'inset 3px 3px 8px rgba(0,0,0,0.5), inset -2px -2px 4px rgba(255,255,255,0.2)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.boxShadow = '3px 3px 8px rgba(0,0,0,0.3), inset -2px -2px 6px rgba(0,0,0,0.4), inset 2px 2px 6px rgba(255,255,255,0.3)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 4v16m8-8H4"
                stroke="currentColor"
                strokeWidth="2.5"
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
              className="text-xs px-2 py-0.5 rounded-md font-bold"
              style={{
                backgroundColor: 'rgba(242, 231, 222, 0.08)',
                color: '#ab947e',
                border: '1px solid rgba(171, 148, 126, 0.25)',
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
