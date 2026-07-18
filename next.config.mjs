/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  experimental: { cpus: 1 },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/:path*.html', destination: '/:path*', permanent: true }
    ];
  }
};

export default nextConfig;
