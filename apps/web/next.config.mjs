/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@meetmaze/shared'],
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};
export default nextConfig;
