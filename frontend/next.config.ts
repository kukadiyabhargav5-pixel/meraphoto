import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optimize package imports for faster bundle
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') 
      : (process.env.NODE_ENV === 'production' ? 'https://meraphotoes.onrender.com' : 'http://127.0.0.1:5000');
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`
      }
    ];
  }
};

export default nextConfig;

