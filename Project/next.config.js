/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Only meaningful over HTTPS; browsers ignore it on plain HTTP.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    cpus: 1,
    workerThreads: false,
  },
  async rewrites() {
    return {
      afterFiles: [
        {
          source: '/uploads/:path*',
          destination: '/api/uploads/:path*',
        },
      ],
    };
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Never cache authenticated/internal responses in browsers or proxies
      { source: '/admin/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
      { source: '/api/internal/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] },
      { source: '/api/auth/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};

module.exports = nextConfig;
