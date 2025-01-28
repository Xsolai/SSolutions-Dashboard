/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'https://app.saincube.com/app2/:path*', // Proxy to Backend
        },
      ]
    }
  };
  
  export default nextConfig;