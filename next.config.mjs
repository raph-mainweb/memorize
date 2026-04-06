/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Shopify product images (CDN)
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: '**.myshopify.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['memorize-liart.vercel.app', 'localhost:3000'],
    },
  },
};

export default nextConfig;
