/** @type {import('next').NextConfig} */
const nextConfig = {
    // 빌드에서 ESLint 에러 무시 (로컬/CI 모두)
    eslint: { ignoreDuringBuilds: true },

    // 필요하면 타입 에러도 임시로 무시 (권장 X)
    // typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
