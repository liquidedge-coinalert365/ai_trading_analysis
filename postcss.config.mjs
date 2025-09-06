/** @type {import('next').NextConfig} */
const isNetlify = process.env.NETLIFY === 'true';

const nextConfig = {
  eslint: { ignoreDuringBuilds: isNetlify }, // Netlify 빌드에서만 ESLint 에러 무시
  // 필요하면 타입 에러도 임시 무시:
  // typescript: { ignoreBuildErrors: isNetlify },
};

export default nextConfig;
