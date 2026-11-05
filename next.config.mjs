/** @type {import('next').NextConfig} */
const nextConfig = {
  // A second dev server (for example one with the 3D scenes on) can use its own build folder: NEXT_DIST_DIR=.next-3d
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  poweredByHeader: false,
  agentRules: false,
  devIndicators: false,
  // No third-party scripts, no analytics. See README.
};
export default nextConfig;


