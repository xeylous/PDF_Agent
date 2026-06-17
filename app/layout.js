import './globals.css';

export const metadata = {
  title: 'PDF Scholar — AI-Powered Document Intelligence',
  description:
    'Upload any PDF and ask questions. Powered by Groq LLM with Gemini semantic search and persistent vector storage.',
  keywords: ['PDF', 'AI', 'RAG', 'Q&A', 'document intelligence', 'Groq', 'Gemini'],
  authors: [{ name: 'PDF Scholar' }],
  openGraph: {
    title:       'PDF Scholar — AI-Powered Document Intelligence',
    description: 'Upload any PDF and ask questions using RAG + Groq LLM.',
    type:        'website',
  },
};

export const viewport = {
  width:        'device-width',
  initialScale: 1,
  themeColor:   '#f2e7de',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
