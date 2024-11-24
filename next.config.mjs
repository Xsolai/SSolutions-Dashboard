/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://http://35.156.80.11:8080/:path*', // Proxy to Backend
        },
      ]
    }
  };
  
  export default nextConfig;