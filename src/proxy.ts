import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth", // bao gồm cả /api/auth/register và các route của next-auth
  "/api/telegram/webhook", // Telegram gọi vào, không có session — tự verify bằng secret token riêng
  "/api/health",
  // next/image tự gọi lại route nội bộ (không kèm cookie) để tối ưu ảnh local,
  // nên assets tĩnh phải public — chặn ở đây sẽ làm mọi ảnh trong scene vỡ ảnh.
  "/assets",
];

export default auth((req) => {
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
