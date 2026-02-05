import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  typescript: {
    // TODO: Remove once all type errors are resolved
    ignoreBuildErrors: true,
  },
  eslint: {
    // TODO: Remove once all lint errors are resolved
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
