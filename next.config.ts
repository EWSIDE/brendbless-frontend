import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Cloudflare Pages serves static files — all API calls go directly to backend
  // No rewrites needed since frontend uses NEXT_PUBLIC_API_URL for all requests
  images: {
    unoptimized: true, // Required for static export
  },
  // Trailing slash for better compatibility with Cloudflare Pages routing
  trailingSlash: true,
};

export default nextConfig;
