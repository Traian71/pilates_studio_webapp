/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'], // For Google profile images if using Google Auth
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/**',
      },
    ],
  },
  // Enable SWC minification for faster builds
  swcMinify: true,
  // Configure redirects if needed
  async redirects() {
    return [
      {
        source: '/staff',
        destination: '/instructor_auth',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
