/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'https://solasolution.ecomtask.de/:path*', // Proxy to Backend
        },
      ]
    }
  };
  
  export default nextConfig;