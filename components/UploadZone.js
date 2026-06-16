'use client';

import { useState, useRef, useCallback } from 'react';

/**
 * components/UploadZone.js
 * Neumorphic drag-and-drop PDF upload zone.
 *
 * States: idle → dragging → uploading → success | error
 * On success, calls onSuccess({ sessionId, filename, pages, chunkCount, cached })
 */
export default function UploadZone({ onSuccess }) {
  const [state, setState]       = useState('idle');    // idle | dragging | uploading | error
  const [progress, setProgress] = useState(0);
  const [statusText, setStatus] = useState('');
  const [errorMsg, setError]    = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  // ── File Processing ──────────────────────────────────────────────────────
  const processFile = useCallback(async (file) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      setState('error');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError(`File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum is 50 MB.`);
      setState('error');
      return;
    }

    setFileName(file.name);
    setState('uploading');
    setProgress(10);
    setStatus('Reading document…');

    try {
      // Simulate progress updates while waiting for the server
      const progressInterval = startProgressSimulation(setProgress, setStatus);

      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body:   formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? `Server error: ${response.status}`);
      }

      const data = await response.json();
      setProgress(100);
      setStatus(data.cached ? 'Using cached embeddings…' : 'Index built!');

      // Brief success flash before handing off
      setTimeout(() => onSuccess(data), 600);

    } catch (err) {
      setError(err.message ?? 'Upload failed. Please try again.');
      setState('error');
    }
  }, [onSuccess]);

  // ── Drag & Drop Handlers ─────────────────────────────────────────────────
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (state === 'idle') setState('dragging');
  }, [state]);

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setState('idle');
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setState('idle');
    const file = e.dataTransfer.files[0];
    processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e) => {
    processFile(e.target.files[0]);
  }, [processFile]);

  const handleRetry = () => {
    setState('idle');
    setProgress(0);
    setError('');
    setFileName('');
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto px-4">

      {/* ── Main Upload Vessel ─────────────────────────────────────────────── */}
      <div
        className="w-full sketch-border p-1.5"
        style={{
          borderColor: '#3e2826',
          boxShadow: '6px 6px 16px rgba(111, 94, 83, 0.15), -6px -6px 16px #ffffff',
          backgroundColor: '#3e2826', // dark leather cover base
        }}
      >
        <div
          className="w-full flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 sketch-border-alt"
          style={{
            backgroundColor: 'rgba(252, 247, 242, 0.72)', // warm parchment overlay
            backdropFilter: 'blur(10px)',
            borderColor: '#ab947e',
            boxShadow: state === 'dragging'
              ? 'inset 6px 6px 16px rgba(111, 94, 83, 0.2), inset -6px -6px 16px #ffffff'
              : 'inset 3px 3px 10px rgba(111, 94, 83, 0.1), inset -3px -3px 10px #ffffff',
            minHeight: '320px',
            borderRadius: '20px 8px 22px 10px / 8px 22px 10px 20px',
            padding: '2.5rem 1.5rem',
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => state === 'idle' && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          aria-label="Upload PDF document"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handleFileInput}
            id="pdf-file-input"
          />

          {/* ── Idle State ──────────────────────────────────────────────── */}
          {(state === 'idle' || state === 'dragging') && (
            <IdleDisplay isDragging={state === 'dragging'} />
          )}

          {/* ── Uploading State ──────────────────────────────────────────── */}
          {state === 'uploading' && (
            <UploadingDisplay
              fileName={fileName}
              progress={progress}
              statusText={statusText}
            />
          )}

          {/* ── Error State ──────────────────────────────────────────────── */}
          {state === 'error' && (
            <ErrorDisplay message={errorMsg} onRetry={handleRetry} />
          )}
        </div>
      </div>

      {/* ── Supported formats note ──────────────────────────────────────────── */}
      {state === 'idle' && (
        <p className="mt-4 text-xs text-center font-medium" style={{ color: '#8a7968' }}>
          Supports PDF with selectable text · Max 50 MB · Embeddings cached per document
        </p>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function IdleDisplay({ isDragging }) {
  return (
    <>
      {/* Document icon — wobbly sketchy glass */}
      <div
        className="flex items-center justify-center w-20 h-20 sketch-border-sm transition-all duration-300"
        style={{
          backgroundColor: isDragging ? 'rgba(171, 148, 126, 0.2)' : 'rgba(252, 247, 242, 0.85)',
          backdropFilter: 'blur(4px)',
          borderColor: '#6f5e53',
          boxShadow: isDragging
            ? 'inset 3px 3px 6px rgba(111, 94, 83, 0.2), inset -3px -3px 6px #ffffff'
            : '4px 4px 10px rgba(111, 94, 83, 0.15), -4px -4px 10px #ffffff',
          transform: isDragging ? 'scale(0.95)' : 'scale(1)',
        }}
      >
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          style={{ opacity: isDragging ? 0.65 : 1, transition: 'opacity 0.2s' }}
        >
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
            stroke="#3e2826"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 2v6h6M12 18v-6M9 15l3-3 3 3"
            stroke="#3e2826"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="text-center select-none">
        <p
          className="text-xl font-bold mb-1.5"
          style={{ fontFamily: "'Playfair Display', serif", color: '#3e2826' }}
        >
          {isDragging ? 'Release to upload' : 'Drop your document'}
        </p>
        <p className="text-sm font-medium" style={{ color: '#8a7968' }}>
          {isDragging ? 'Let it go…' : 'or click to browse files'}
        </p>
      </div>

      {/* Browse button */}
      {!isDragging && (
        <div
          className="px-6 py-2.5 sketch-border-sm text-sm font-semibold transition-all duration-150 select-none"
          style={{
            color: '#3e2826',
            borderColor: '#6f5e53',
            boxShadow: '3px 3px 8px rgba(111, 94, 83, 0.12), -3px -3px 8px #ffffff',
            backgroundColor: 'rgba(252, 247, 242, 0.9)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = 'inset 2px 2px 5px rgba(111, 94, 83, 0.15), inset -2px -2px 5px #ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '3px 3px 8px rgba(111, 94, 83, 0.12), -3px -3px 8px #ffffff';
          }}
        >
          Browse PDF
        </div>
      )}

      {/* Feature tags */}
      {!isDragging && (
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {['Groq LLM', 'Gemini Embeddings', 'pgvector Search'].map((tag) => (
            <span
              key={tag}
              className="text-xs px-3 py-1 sketch-border-sm font-medium select-none"
              style={{
                color: '#8a7968',
                borderColor: 'rgba(111, 94, 83, 0.35)',
                backgroundColor: 'rgba(252, 247, 242, 0.65)',
                boxShadow: 'inset 1px 1px 3px rgba(111, 94, 83, 0.1), inset -1px -1px 3px #ffffff',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function UploadingDisplay({ fileName, progress, statusText }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <>
      {/* Progress Ring */}
      <div className="relative flex items-center justify-center">
        <svg width="100" height="100" viewBox="0 0 100 100">
          {/* Track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#b09582"
            strokeWidth="5"
            opacity="0.3"
          />
          {/* Progress arc */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#6f5e53"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        </svg>
        {/* Percentage */}
        <span
          className="absolute text-sm font-semibold"
          style={{ color: '#593d3b' }}
        >
          {progress}%
        </span>
      </div>

      {/* File name */}
      <div className="text-center">
        <p
          className="text-base font-medium truncate max-w-xs"
          style={{ color: '#593d3b', fontFamily: "'Playfair Display', serif" }}
        >
          {fileName}
        </p>
        <p className="text-sm mt-1" style={{ color: '#8a7968' }}>
          {statusText}
        </p>
      </div>

      {/* Ink drop animation */}
      <div className="flex items-center gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="ink-drop-dot"
            style={{
              animationName: 'ink-drop',
              animationDuration: '1.4s',
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

function ErrorDisplay({ message, onRetry }) {
  return (
    <>
      {/* Error icon */}
      <div
        className="flex items-center justify-center w-16 h-16 sketch-border-sm"
        style={{
          backgroundColor: 'rgba(139, 58, 58, 0.12)',
          borderColor: '#8b3a3a',
          boxShadow: 'inset 3px 3px 6px rgba(111, 94, 83, 0.1), inset -3px -3px 6px #ffffff',
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke="#8b3a3a"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="text-center select-none">
        <p
          className="text-base font-bold mb-1.5"
          style={{ color: '#8b3a3a', fontFamily: "'Playfair Display', serif" }}
        >
          Upload Failed
        </p>
        <p className="text-sm max-w-xs font-medium" style={{ color: '#8a7968' }}>
          {message}
        </p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onRetry(); }}
        className="px-6 py-2.5 sketch-border-sm text-sm font-semibold transition-all duration-150"
        style={{
          color: '#8b3a3a',
          borderColor: '#8b3a3a',
          backgroundColor: 'rgba(252, 247, 242, 0.9)',
          boxShadow: '3px 3px 8px rgba(139, 58, 58, 0.12), -3px -3px 8px #ffffff',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'inset 2.5px 2.5px 5px rgba(139, 58, 58, 0.15), inset -2.5px -2.5px 5px #ffffff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '3px 3px 8px rgba(139, 58, 58, 0.12), -3px -3px 8px #ffffff';
        }}
      >
        Try Again
      </button>
    </>
  );
}

// ─── Progress Simulation ──────────────────────────────────────────────────────

function startProgressSimulation(setProgress, setStatus) {
  const steps = [
    { target: 25, label: 'Extracting text…',      delay: 800  },
    { target: 45, label: 'Splitting into chunks…', delay: 1500 },
    { target: 65, label: 'Generating embeddings…', delay: 3000 },
    { target: 85, label: 'Storing in database…',   delay: 6000 },
    { target: 92, label: 'Finalizing index…',      delay: 9000 },
  ];

  const timers = [];
  let elapsed = 0;

  for (const step of steps) {
    elapsed += step.delay;
    const timer = setTimeout(() => {
      setProgress(step.target);
      setStatus(step.label);
    }, elapsed);
    timers.push(timer);
  }

  return { clearInterval: () => timers.forEach(clearTimeout) }; // compatible API
}
