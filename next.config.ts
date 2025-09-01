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
         {
            protocol: 'https',
            hostname: 'homeline.com.gr',
            port: '',
            pathname: '/wp-content/uploads/**',
         },
      ],
   },
}

export default nextConfig
