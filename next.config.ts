import type { NextConfig } from 'next';
const isNetlify = process.env.NETLIFY === 'true';

const nextConfig: NextConfig = {
    eslint: { ignoreDuringBuilds: isNetlify },
    // typescript: { ignoreBuildErrors: isNetlify },
};
export default nextConfig;
