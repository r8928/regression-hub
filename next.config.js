/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['mongodb'],
  transpilePackages: ['jspdf', 'jspdf-autotable'],
  experimental: {
    // Rewrite MUI barrel imports to direct subpath imports at build time.
    // Without this, Next's __barrel_optimize__ loader hits "conflicting star
    // exports" against MUI v9's dual ESM/CJS bundles on Linux (Vercel).
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },

  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = { ...config.resolve.alias, canvas: false };
    }
    return config;
  },
};

module.exports = nextConfig;
