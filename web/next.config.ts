import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@rechess/shared"],
  images: {
    remotePatterns: [
      { hostname: "images.chesscomfiles.com" },
    ],
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      ],
    },
  ],
};

export default nextConfig;
