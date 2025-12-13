/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config, { isServer }) => {
    // Prevent bcrypt and related modules from being bundled in client
    if (!isServer) {
      config.externals = [...(config.externals || []), 'bcrypt', '@mapbox/node-pre-gyp', 'node-pre-gyp']
      
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        bcrypt: false,
        '@mapbox/node-pre-gyp': false,
      }
    }

    return config
  },
}

module.exports = nextConfig
