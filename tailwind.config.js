/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './pages/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        neu: {
          base:     '#c3a995',
          light:    '#d8c4b6',
          lighter:  '#e5d4cb',
          dark:     '#9a7a6a',
          darker:   '#7a5e52',
          espresso: '#593d3b',
          olive:    '#8a7968',
          brown:    '#6f5e53',
          tan:      '#ab947e',
          white:    '#ffffff',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Raised (elevated) neumorphic element
        'neu':        '8px 8px 16px #9a7a6a, -8px -8px 16px #d8c4b6',
        'neu-sm':     '4px 4px 8px #9a7a6a, -4px -4px 8px #d8c4b6',
        'neu-xs':     '2px 2px 4px #9a7a6a, -2px -2px 4px #d8c4b6',
        // Inset/pressed neumorphic element
        'neu-inset':     'inset 6px 6px 12px #9a7a6a, inset -6px -6px 12px #d8c4b6',
        'neu-inset-sm':  'inset 3px 3px 6px #9a7a6a, inset -3px -3px 6px #d8c4b6',
        'neu-inset-xs':  'inset 2px 2px 4px #9a7a6a, inset -2px -2px 4px #d8c4b6',
        // Combined (hover active state)
        'neu-active': '3px 3px 6px #9a7a6a, -3px -3px 6px #d8c4b6',
      },
      keyframes: {
        'ink-drop': {
          '0%, 100%': { transform: 'scale(1)',    opacity: '0.5' },
          '50%':      { transform: 'scale(1.5)',   opacity: '1'   },
        },
        'ink-drop-2': {
          '0%, 100%': { transform: 'scale(1)',    opacity: '0.3' },
          '50%':      { transform: 'scale(1.5)',   opacity: '0.9' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        'unfurl': {
          '0%':   { transform: 'scaleY(0.8)', opacity: '0', transformOrigin: 'top' },
          '100%': { transform: 'scaleY(1)',   opacity: '1', transformOrigin: 'top' },
        },
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        'stamp-in': {
          '0%':   { transform: 'scale(1.04) rotate(-1deg)', opacity: '0' },
          '60%':  { transform: 'scale(0.98) rotate(0.3deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)',       opacity: '1' },
        },
        'source-fade': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'ink-drop':   'ink-drop 1.4s ease-in-out infinite',
        'ink-drop-2': 'ink-drop-2 1.4s ease-in-out 0.3s infinite',
        'ink-drop-3': 'ink-drop-2 1.4s ease-in-out 0.6s infinite',
        'slide-up':   'slide-up 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
        'unfurl':     'unfurl 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'cursor-blink': 'cursor-blink 1s ease-in-out infinite',
        'stamp-in':   'stamp-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        'source-fade': 'source-fade 0.5s ease-out',
        'spin-slow':  'spin-slow 2s linear infinite',
      },
    },
  },
  plugins: [],
};
