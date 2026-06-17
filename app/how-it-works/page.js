'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer.js';

const STEPS = [
  {
    title: '1. Ingestion & Chunking',
    subtitle: 'Breaking down the scroll',
    description: 'When you upload a PDF, the application extracts its raw text contents page-by-page. Since LLMs have token limits and to ensure precise similarity search, the text is sliced into overlapping segments of 1,400 characters, with a 250-character buffer to preserve context across boundaries.',
    details: [
      { label: 'File Type', value: 'Portable Document Format (.pdf)' },
      { label: 'Chunk Size', value: '1,400 Characters (approx. 250 words)' },
      { label: 'Overlap', value: '250 Characters (prevents sentence division)' },
      { label: 'Deduplication', value: 'SHA-256 hash checking prevents redundant parsing' },
    ],
  },
  {
    title: '2. Semantic Embedding',
    subtitle: 'Translating text to numbers',
    description: 'Each text chunk is sent to the Google Gemini Embeddings API. It runs the text through a deep neural network to produce a 768-dimensional vector embedding. This vector represents the semantic meaning of the text as coordinates in high-dimensional space.',
    details: [
      { label: 'Embedding Model', value: 'gemini-embedding-001' },
      { label: 'Dimensions', value: '768 coordinates' },
      { label: 'Matryoshka Learning', value: 'Supports semantic truncation down to 768 from 3072' },
      { label: 'Vector Meaning', value: 'Chunks with similar ideas sit closer together in space' },
    ],
  },
  {
    title: '3. Vector Storage (Neon)',
    subtitle: 'Archiving in the Vault',
    description: 'The session metadata and the chunks with their high-dimensional vector embeddings are stored in Neon Database. Using PostgreSQL with the pgvector extension, the vectors are saved directly in a vector(768) column for blazing-fast similarity indexing.',
    details: [
      { label: 'Database Provider', value: 'Neon Serverless PostgreSQL' },
      { label: 'Extension', value: 'pgvector (enables vector data types)' },
      { label: 'Vector Index', value: 'IVFFlat (Inverted File with Flat, lists = 100)' },
      { label: 'Optimization', value: 'HTTP pooling holds queries open during serverless sleeps' },
    ],
  },
  {
    title: '4. Vector Lookup & Search',
    subtitle: 'Finding the right scrolls',
    description: 'When you type a query, the application converts it into a 768-dim question embedding. It then fires a cosine similarity search against Neon DB using the <=> operator. This retrieves the top-K chunks (default: 4) that contain the most semantically relevant text matching your query.',
    details: [
      { label: 'Query Embedder', value: 'gemini-embedding-001 (QUESTION_ANSWERING mode)' },
      { label: 'Retrieval Count', value: 'Top 4 closest context chunks (Top K = 4)' },
      { label: 'Similarity Metrics', value: 'Cosine Distance (ascending values = closer match)' },
      { label: 'DB Operator', value: 'embedding <=> [question_vector]::vector' },
    ],
  },
  {
    title: '5. Synthesis & Streaming',
    subtitle: 'Writing the answer in real-time',
    description: 'The retrieved PDF context and your question are stuffed into a prompt template. This prompt is dispatched to Groq Cloud. Groq runs the Llama-3.3 70B model to synthesize a detailed answer, which streams back to the browser in real-time via Server-Sent Events (SSE).',
    details: [
      { label: 'LLM Host', value: 'Groq Cloud API (extremely low latency)' },
      { label: 'Model', value: 'llama-3.3-70b-versatile' },
      { label: 'Format', value: 'Markdown format with clickable citation footnotes' },
      { label: 'SSE Stream', value: 'Server-Sent Events (token-by-token rendering)' },
    ],
  },
];

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [hasSession, setHasSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('pdfScholar.session');
      if (saved) {
        setHasSession(true);
      }
    } catch {}
  }, []);

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div
      className="flex flex-col min-h-screen w-full relative pb-12"
      style={{
        backgroundColor: 'transparent', // Let layout background grid show
      }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header
        className="w-full flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b-2"
        style={{
          backgroundColor: 'rgba(62, 40, 38, 0.94)',
          borderColor: '#3e2826',
          borderRadius: '0 0 16px 18px / 0 0 12px 15px',
          boxShadow: '0 8px 32px rgba(62, 40, 38, 0.15)',
        }}
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 px-3 py-1.5 sketch-border-sm text-xs font-bold transition-all duration-150"
          style={{
            backgroundColor: 'rgba(252, 247, 242, 0.12)',
            color: '#fcfaf7',
            borderColor: 'rgba(171, 148, 126, 0.5)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(252, 247, 242, 0.22)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(252, 247, 242, 0.12)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {hasSession ? 'Back to Chat' : 'Main Page'}
        </button>

        <div className="text-center">
          <h1
            className="text-base sm:text-lg font-bold tracking-wider leading-none"
            style={{ fontFamily: "'Playfair Display', serif", color: '#fcfaf7' }}
          >
            Ledger Mechanics
          </h1>
          <p className="text-[10px] sm:text-xs mt-0.5 font-medium italic" style={{ color: '#ab947e' }}>
            Inside the Scholar&apos;s RAG Engine
          </p>
        </div>

        <div className="w-[100px] hidden sm:block text-right">
          <span
            className="text-[10px] px-2 py-0.5 rounded border font-bold"
            style={{
              backgroundColor: 'rgba(252, 247, 242, 0.08)',
              color: '#ab947e',
              borderColor: 'rgba(171, 148, 126, 0.25)',
            }}
          >
            RAG PIPELINE
          </span>
        </div>
      </header>

      {/* ── Main Layout ──────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 mt-8 w-full flex-1 flex flex-col gap-6 sm:gap-8">
        
        {/* Intro */}
        <div className="text-center max-w-xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl font-semibold mb-2"
            style={{ fontFamily: "'Playfair Display', serif", color: '#3e2826' }}
          >
            The Journey of a Query
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--olive)' }}>
            Follow the ink. From a static document to a live semantic stream, this is how your questions are analyzed and answered in real-time.
          </p>
        </div>

        {/* Stepper Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto w-full">
          {STEPS.map((step, idx) => {
            const isActive = idx === activeStep;
            return (
              <button
                key={step.title}
                onClick={() => setActiveStep(idx)}
                className="px-3.5 py-2.5 sketch-border-sm text-xs font-bold transition-all duration-200 select-none flex-1 min-w-[150px] max-w-[200px]"
                style={{
                  backgroundColor: isActive ? 'rgba(139, 58, 58, 0.85)' : 'rgba(252, 247, 242, 0.72)',
                  color: isActive ? '#fcfaf7' : '#3e2826',
                  borderColor: isActive ? '#602222' : '#ab947e',
                  boxShadow: isActive
                    ? '3px 3px 6px rgba(0,0,0,0.15), inset -1.5px -1.5px 3px rgba(0,0,0,0.2)'
                    : '2px 2px 5px rgba(111, 94, 83, 0.06), -2px -2px 5px #ffffff',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(252, 247, 242, 0.9)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(252, 247, 242, 0.72)';
                  }
                }}
              >
                {step.title.split('. ')[1]}
              </button>
            );
          })}
        </div>

        {/* ── Interactive Diagram Box ────────────────────────────────────────── */}
        <div
          className="w-full sketch-border p-1.5"
          style={{
            borderColor: '#3e2826',
            boxShadow: '6px 6px 16px rgba(111, 94, 83, 0.15), -6px -6px 16px #ffffff',
            backgroundColor: '#3e2826', // dark leather frame
          }}
        >
          <div
            className="w-full flex flex-col items-center justify-center p-6 sm:p-10 sketch-border-alt relative overflow-hidden"
            style={{
              backgroundColor: 'rgba(252, 247, 242, 0.78)', // parchment paper
              backdropFilter: 'blur(10px)',
              borderColor: '#ab947e',
              minHeight: '380px',
            }}
          >
            {/* SVG Visual Canvas */}
            <svg
              className="w-full max-w-3xl h-[220px] sm:h-[260px] animate-float-sketch select-none overflow-visible"
              viewBox="0 0 800 240"
              fill="none"
            >
              {/* Connector Paths */}
              {/* 1 -> 2 */}
              <path
                d="M130 120 H240"
                stroke={activeStep >= 1 ? '#8b3a3a' : '#ab947e'}
                strokeWidth="2.5"
                strokeDasharray={activeStep === 0 ? '6,6' : 'none'}
                className={activeStep === 0 ? 'animate-dash-flow' : ''}
                style={{ transition: 'stroke 0.4s ease' }}
              />
              {/* 2 -> 3 */}
              <path
                d="M290 120 H390"
                stroke={activeStep >= 2 ? '#8b3a3a' : '#ab947e'}
                strokeWidth="2.5"
                strokeDasharray={activeStep === 1 ? '6,6' : 'none'}
                className={activeStep === 1 ? 'animate-dash-flow' : ''}
                style={{ transition: 'stroke 0.4s ease' }}
              />
              {/* 3 -> 4 */}
              <path
                d="M440 120 H540"
                stroke={activeStep >= 3 ? '#8b3a3a' : '#ab947e'}
                strokeWidth="2.5"
                strokeDasharray={activeStep === 2 ? '6,6' : 'none'}
                className={activeStep === 2 ? 'animate-dash-flow' : ''}
                style={{ transition: 'stroke 0.4s ease' }}
              />
              {/* Query -> 4 */}
              <path
                d="M500 45 V95"
                stroke={activeStep >= 3 ? '#8b3a3a' : '#ab947e'}
                strokeWidth="2"
                strokeDasharray={activeStep === 3 ? '4,4' : 'none'}
                className={activeStep === 3 ? 'animate-dash-flow' : ''}
                style={{ transition: 'stroke 0.4s ease' }}
              />
              {/* 4 -> 5 */}
              <path
                d="M590 120 H680"
                stroke={activeStep >= 4 ? '#8b3a3a' : '#ab947e'}
                strokeWidth="2.5"
                strokeDasharray={activeStep === 3 ? '6,6' : 'none'}
                className={activeStep === 3 ? 'animate-dash-flow' : ''}
                style={{ transition: 'stroke 0.4s ease' }}
              />

              {/* Step 1: PDF Chunker Node */}
              <g transform="translate(80, 120)">
                <circle
                  r="42"
                  fill="rgba(252, 247, 242, 0.95)"
                  className={activeStep === 0 ? 'animate-pulse-glow' : ''}
                  style={{
                    stroke: activeStep === 0 ? '#8b3a3a' : '#ab947e',
                    strokeWidth: activeStep === 0 ? 3 : 2,
                    transition: 'all 0.4s ease',
                  }}
                />
                {/* PDF Page sheet icon */}
                <path d="M-15 -20 h22 l8 8 v24 h-30 Z" stroke="#3e2826" strokeWidth="1.8" />
                <path d="M7 -20 v8 h8" stroke="#3e2826" strokeWidth="1.5" />
                <line x1="-10" y1="-5" x2="10" y2="-5" stroke="#6f5e53" strokeWidth="1.5" />
                <line x1="-10" y1="2" x2="10" y2="2" stroke="#6f5e53" strokeWidth="1.5" />
                <line x1="-10" y1="9" x2="2" y2="9" stroke="#6f5e53" strokeWidth="1.5" />
                {/* Slicer/cutting lines */}
                {activeStep === 0 && (
                  <path d="M-22 5 C -25 -5, -30 20, 25 -10" stroke="#8b3a3a" strokeWidth="2.5" strokeDasharray="3,3" />
                )}
                <text y="58" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3e2826">PDF Chunking</text>
              </g>

              {/* Step 2: Gemini Encoder Node */}
              <g transform="translate(265, 120)">
                <circle
                  r="42"
                  fill="rgba(252, 247, 242, 0.95)"
                  className={activeStep === 1 ? 'animate-pulse-glow' : ''}
                  style={{
                    stroke: activeStep === 1 ? '#8b3a3a' : '#ab947e',
                    strokeWidth: activeStep === 1 ? 3 : 2,
                    transition: 'all 0.4s ease',
                  }}
                />
                {/* Quill & Ink icon */}
                <path d="M-12 18 C -12 10, -5 5, 2 -10 C 5 -16, 12 -22, 16 -24 C 15 -18, 12 -12, 5 -6 C -2 0, -8 10, -12 18 Z" fill="#6f5e53" />
                <circle cx="-12" cy="18" r="3" fill="#3e2826" />
                {/* Sparkles */}
                <path d="M12 -12 l2-2 M15 -6 l3 1 M6 -15 l-1-3" stroke="#8a7968" strokeWidth="1.5" />
                <text y="58" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3e2826">Gemini Embed</text>
              </g>

              {/* Step 3: Neon Vault Node */}
              <g transform="translate(415, 120)">
                <circle
                  r="42"
                  fill="rgba(252, 247, 242, 0.95)"
                  className={activeStep === 2 ? 'animate-pulse-glow' : ''}
                  style={{
                    stroke: activeStep === 2 ? '#8b3a3a' : '#ab947e',
                    strokeWidth: activeStep === 2 ? 3 : 2,
                    transition: 'all 0.4s ease',
                  }}
                />
                {/* Storage vault chest icon */}
                <rect x="-18" y="-12" width="36" height="26" rx="3" stroke="#3e2826" strokeWidth="1.8" />
                <path d="M-18 -12 C -18 -22, 18 -22, 18 -12 Z" stroke="#3e2826" strokeWidth="1.8" />
                <line x1="-18" y1="0" x2="18" y2="0" stroke="#3e2826" strokeWidth="1.5" />
                <circle cx="0" cy="5" r="2.5" fill="#3e2826" />
                <line x1="0" y1="8" x2="0" y2="11" stroke="#3e2826" strokeWidth="1.5" />
                <text y="58" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3e2826">Neon pgvector</text>
              </g>

              {/* Search Vector (Query input) from top */}
              <g transform="translate(500, 30)">
                <rect x="-40" y="-15" width="80" height="28" rx="6" stroke="#ab947e" strokeWidth="1.5" fill="rgba(252, 247, 242, 0.95)" />
                <text y="3" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#8a7968" letterSpacing="0.05em">USER QUERY</text>
              </g>

              {/* Step 4: Similarity Comparison Lens Node */}
              <g transform="translate(565, 120)">
                <circle
                  r="42"
                  fill="rgba(252, 247, 242, 0.95)"
                  className={activeStep === 3 ? 'animate-pulse-glow' : ''}
                  style={{
                    stroke: activeStep === 3 ? '#8b3a3a' : '#ab947e',
                    strokeWidth: activeStep === 3 ? 3 : 2,
                    transition: 'all 0.4s ease',
                  }}
                />
                {/* Search Magnifying lens containing <=> */}
                <circle cx="-3" cy="-4" r="10" stroke="#3e2826" strokeWidth="1.8" />
                <line x1="4" y1="3" x2="14" y2="13" stroke="#3e2826" strokeWidth="2.2" strokeLinecap="round" />
                <text x="-3" y="-1" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#6f5e53">&lt;=&gt;</text>
                <text y="58" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3e2826">Cosine Search</text>
              </g>

              {/* Step 5: Groq Forge Node */}
              <g transform="translate(715, 120)">
                <circle
                  r="42"
                  fill="rgba(252, 247, 242, 0.95)"
                  className={activeStep === 4 ? 'animate-pulse-glow' : ''}
                  style={{
                    stroke: activeStep === 4 ? '#8b3a3a' : '#ab947e',
                    strokeWidth: activeStep === 4 ? 3 : 2,
                    transition: 'all 0.4s ease',
                  }}
                />
                {/* Parchment scroll with text synthesis */}
                <path d="M-15 -18 h28 C 15 -18, 16 -10, 10 -10 H-10 C-16 -10, -15 -2, -10 -2 H15 C 20 -2, 18 18, 5 18 H-18" stroke="#3e2826" strokeWidth="1.8" fill="none" />
                <path d="M-10 -14 h12 M-12 -6 h18 M-15 2 h15 M-10 10 h10" stroke="#6f5e53" strokeWidth="1.2" />
                {activeStep === 4 && (
                  <circle cx="12" cy="10" r="2" fill="#8b3a3a" className="animate-ping" />
                )}
                <text y="58" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3e2826">Groq Synthesis</text>
              </g>
            </svg>

            {/* Stepper info box inside parchment */}
            <div
              className="mt-6 sm:mt-8 p-5 rounded-2xl w-full max-w-3xl sketch-border-sm relative"
              style={{
                backgroundColor: 'rgba(252, 247, 242, 0.85)',
                borderColor: '#ab947e',
                boxShadow: 'inset 1.5px 1.5px 4px rgba(111, 94, 83, 0.08), inset -1.5px -1.5px 4px #ffffff',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{ backgroundColor: 'var(--mid-brown)', color: '#fcfaf7' }}
                >
                  {STEPS[activeStep].subtitle}
                </span>
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ fontFamily: "'Playfair Display', serif", color: 'var(--espresso)' }}
              >
                {STEPS[activeStep].title.split('. ')[1]}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed mb-6 font-semibold" style={{ color: 'var(--espresso)' }}>
                {STEPS[activeStep].description}
              </p>

              {/* Grid specifics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t" style={{ borderColor: 'rgba(111, 94, 83, 0.2)' }}>
                {STEPS[activeStep].details.map((detail) => (
                  <div key={detail.label} className="flex items-start gap-2 text-xs">
                    <span style={{ color: 'var(--olive)' }} className="font-bold select-none">•</span>
                    <div>
                      <span className="font-bold text-gray-700 block sm:inline mr-1" style={{ color: 'var(--espresso)' }}>
                        {detail.label}:
                      </span>
                      <span className="font-semibold" style={{ color: 'var(--mid-brown)' }}>
                        {detail.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Static Architecture Details (Bottom) */}
        <div
          className="p-6 sketch-border-alt"
          style={{
            backgroundColor: 'rgba(252, 247, 242, 0.65)',
            borderColor: '#ab947e',
            boxShadow: '4px 4px 12px rgba(111, 94, 83, 0.06), -4px -4px 12px #ffffff',
          }}
        >
          <h3
            className="text-lg font-semibold mb-4 text-center sm:text-left"
            style={{ fontFamily: "'Playfair Display', serif", color: 'var(--espresso)' }}
          >
            The RAG Blueprint
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-xs" style={{ color: 'var(--olive)' }}>
                1. The Ingestion Pipeline (One-Time)
              </h4>
              <p className="leading-relaxed font-medium" style={{ color: 'var(--mid-brown)' }}>
                When you drop your document, a SHA-256 hash is computed. If the hash exists in the <code className="px-1 py-0.5 rounded bg-white font-mono text-xs shadow-inner">pdf_sessions</code> database table, indexing is skipped completely. Otherwise, it extracts, segments, embeddings are computed via Gemini models using Matryoshka Representation Learning (MRL) truncation to 768 dimensions, and stores vectors into Neon DB.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-xs" style={{ color: 'var(--olive)' }}>
                2. The Query Pipeline (Every Question)
              </h4>
              <p className="leading-relaxed font-medium" style={{ color: 'var(--mid-brown)' }}>
                Your question is vectorized in real-time. We perform an index-accelerated Cosine Distance vector comparison (<code className="px-1 py-0.5 rounded bg-white font-mono text-xs shadow-inner">embedding &lt;=&gt; question_vector</code>) in pgvector to instantly retrieve context. Groq LLM streams the synthesized answer over a Server-Sent Event connection directly to your inkwell.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-5 py-2.5 sketch-seal text-sm font-bold transition-all duration-200"
              style={{
                backgroundColor: 'rgba(139, 58, 58, 0.85)',
                color: '#fcfaf7',
                borderColor: '#602222',
                boxShadow: '3px 3px 8px rgba(0,0,0,0.3), inset -2px -2px 6px rgba(0,0,0,0.4), inset 2px 2px 6px rgba(255,255,255,0.3)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03)';
                e.currentTarget.style.backgroundColor = 'rgba(139, 58, 58, 0.95)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.backgroundColor = 'rgba(139, 58, 58, 0.85)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Go to Workspace
            </button>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
