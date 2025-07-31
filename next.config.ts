import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
   images: {
      remotePatterns: [
         {
            protocol: 'https',
            hostname: 'adamhome.gr',
            port: '',
            pathname: '/image/**',
         },
      ],
   },
}

export default nextConfig
