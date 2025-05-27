/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'https://solasolution.ecomtask.de/:path*', // Proxy to Backend
        },
      ]
    },
    reactStrictMode: true,
    // Deaktiviere die Entwicklerwerkzeuge im Entwicklungsmodus
    devIndicators: {
      buildActivity: false
    },
    webpack: (config, { dev, isServer }) => {
      // Nur im Entwicklungsmodus und Client-seitig
      if (dev && !isServer) {
        // Deaktiviere die Overlay-Warnungen
        config.devServer = {
          ...config.devServer,
          client: {
            ...config.devServer?.client,
            overlay: false
          }
        };
      }
      return config;
    }
  };
  
  export default nextConfig;