import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "https://api.brandbless.ru/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
