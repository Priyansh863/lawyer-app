/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration
  compress: true, // Enable gzip compression
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Webpack optimizations (simplified)
  webpack: (config, { dev, isServer }) => {
    // Basic optimizations only
    if (!dev && !isServer) {
      config.optimization.usedExports = true;
    }
    return config;
  },

  // Basic headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
