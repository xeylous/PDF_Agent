/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mark pdf-parse as a server-only external package (Node.js runtime)
  serverExternalPackages: ['pdf-parse'],

  // Increase body size limit for PDF uploads (up to 50MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },

  // Webpack alias to avoid pdf-parse's test-file issue in Next.js
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias['pdf-parse'] = require.resolve('pdf-parse/lib/pdf-parse.js');
    }
    return config;
  },
};

module.exports = nextConfig;
