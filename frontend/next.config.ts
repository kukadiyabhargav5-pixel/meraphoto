import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['recharts', 'victory-vendor'],
  webpack: (config) => {
    const path = require('path');
    const getModulePath = (pkgName: string) => {
      try {
        return path.dirname(require.resolve(`${pkgName}/package.json`, { paths: [__dirname, process.cwd()] }));
      } catch {
        return pkgName;
      }
    };

    config.resolve.alias = {
      ...config.resolve.alias,
      'victory-vendor/d3-scale': getModulePath('d3-scale'),
      'victory-vendor/d3-shape': getModulePath('d3-shape'),
      'victory-vendor/d3-array': getModulePath('d3-array'),
      'victory-vendor/d3-color': getModulePath('d3-color'),
      'victory-vendor/d3-ease': getModulePath('d3-ease'),
      'victory-vendor/d3-format': getModulePath('d3-format'),
      'victory-vendor/d3-interpolate': getModulePath('d3-interpolate'),
      'victory-vendor/d3-path': getModulePath('d3-path'),
      'victory-vendor/d3-time': getModulePath('d3-time'),
      'victory-vendor/d3-timer': getModulePath('d3-timer'),
      'd3-scale': getModulePath('d3-scale'),
      'd3-shape': getModulePath('d3-shape'),
      'd3-array': getModulePath('d3-array'),
      'd3-color': getModulePath('d3-color'),
      'd3-ease': getModulePath('d3-ease'),
      'd3-format': getModulePath('d3-format'),
      'd3-interpolate': getModulePath('d3-interpolate'),
      'd3-path': getModulePath('d3-path'),
      'd3-time': getModulePath('d3-time'),
      'd3-timer': getModulePath('d3-timer'),
    };
    return config;
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') 
      : (process.env.NODE_ENV === 'production' ? 'https://meraphotoes.onrender.com' : 'http://127.0.0.1:5000');
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`
      },
      {
        source: '/admin-dashboard/:path+',
        destination: '/dashboard/:path*'
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/features',
        destination: '/#features',
        permanent: true,
      },
      {
        source: '/auth/login',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/dashboard/studio-branding',
        destination: '/dashboard/profile',
        permanent: true,
      },
      {
        source: '/dashboard/studio-settings',
        destination: '/dashboard/profile',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  }
};

export default nextConfig;
