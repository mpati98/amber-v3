import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth", // bao gồm cả /api/auth/register và các route của next-auth
  "/api/health",
  // next/image tự gọi lại route nội bộ (không kèm cookie) để tối ưu ảnh local,
  // nên assets tĩnh phải public — chặn ở đây sẽ làm mọi ảnh trong scene vỡ ảnh.
  "/assets",
];

export default auth((req) => {
  // API gọi được từ app Flutter xác thực bằng Bearer token, proxy chỉ biết
  // cookie NextAuth nên không kiểm tra ở đây. Mỗi route dưới các prefix này
  // tự check qua withAuth (lib/withAuth.ts), hỗ trợ cả cookie web lẫn Bearer
  // mobile — proxy KHÔNG còn là lớp chặn cho các path này, route nào quên bọc
  // withAuth sẽ mở công khai. Ngoại lệ duy nhất: /api/mobile/auth/*.
  // /api/kieu-lau/* dùng chung cho web + Flutter.
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/mobile/") || pathname.startsWith("/api/kieu-lau/")) {
    // Preflight CORS không kèm token. Header CORS do next.config.ts gắn vào.
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204 });
    }
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => req.nextUrl.pathname.startsWith(p));
  if (isPublic || req.auth) {
    return NextResponse.next();
  }

  // API gọi mà chưa đăng nhập -> trả 401 thay vì redirect (client fetch không theo redirect HTML)
  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.nextUrl.origin);
  loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
