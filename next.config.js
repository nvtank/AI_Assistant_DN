/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // App Router is enabled by default in Next.js 14+
  images: {
    domains: ['firebasestorage.googleapis.com', 'via.placeholder.com', 'images.unsplash.com', 'maps.googleapis.com'],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
}

module.exports = nextConfig
