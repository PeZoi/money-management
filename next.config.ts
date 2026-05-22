import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Tắt unoptimized để đảm bảo icon SVG được xử lý đúng
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
  allowedDevOrigins: ['10.20.13.90'],
};

export default nextConfig;
