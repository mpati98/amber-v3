import type { NextConfig } from "next";

const mobileCorsHeaders = [
  { key: "Access-Control-Allow-Origin", value: process.env.MOBILE_APP_ORIGIN || "*" },
  { key: "Access-Control-Allow-Methods", value: "GET, POST, PATCH, DELETE, OPTIONS" },
  { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
];

const nextConfig: NextConfig = {
  // CORS chỉ cho API mà app Flutter gọi (cross-origin bằng Bearer token):
  // /api/mobile/* và các API dùng chung web + Flutter: Kiều Lâu, Tàng Kinh Các,
  // Nghị Sự Đường (projects, tasks, du-an, finance, learn).
  // Các route khác chỉ web gọi same-origin qua cookie, không cần CORS.
  async headers() {
    return [
      { source: "/api/mobile/:path*", headers: mobileCorsHeaders },
      { source: "/api/kieu-lau/:path*", headers: mobileCorsHeaders },
      { source: "/api/tang-kinh-cac/:path*", headers: mobileCorsHeaders },
      // `:path*` khớp cả 0 đoạn → gồm luôn /api/projects, /api/tasks.
      ...["projects", "tasks", "du-an", "finance", "learn"].map((p) => ({
        source: `/api/${p}/:path*`,
        headers: mobileCorsHeaders,
      })),
    ];
  },
};

export default nextConfig;
