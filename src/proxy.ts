import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/reset-password", "/api/auth"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Exclude Next internals and the public/assets static sprites — the image
  // optimizer's internal fetch for those doesn't carry the browser's session
  // cookie and would otherwise always get redirected.
  //
  // This must NOT be a blanket "any path with a dot" exclusion: API routes
  // like /api/tang-kinh-cac/blob/<pathname>.jpg (proxying private Vercel Blob
  // files) also contain a dot, and a blanket rule would let them skip the
  // auth check entirely, serving "private" files to anyone.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets/).*)"],
};
