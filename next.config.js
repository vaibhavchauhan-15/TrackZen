/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  // Enable compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Optimize JS & CSS
  swcMinify: true,
  // Enable React Server Components optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'framer-motion', 'recharts'],
  },
  // Prefetch all links on hover
  reactStrictMode: true,
}

module.exports = nextConfig
