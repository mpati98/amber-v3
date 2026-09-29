import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CORS chỉ cho API của app Flutter (gọi cross-origin bằng Bearer token).
  // Các route khác chỉ web gọi same-origin qua cookie, không cần CORS.
  async headers() {
    return [
      {
        source: "/api/mobile/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.MOBILE_APP_ORIGIN || "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PATCH, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
