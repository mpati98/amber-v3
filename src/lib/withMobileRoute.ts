import { NextRequest, NextResponse } from "next/server";
import { withApiError } from "@/lib/apiError";
import { getUserId } from "@/lib/mobile-auth";

// Bắt buộc cho mọi route /api/mobile/* cần đăng nhập — proxy.ts không kiểm tra
// session cho /api/mobile/, nên route không bọc wrapper này sẽ mở công khai.
// Không dùng cho /api/mobile/auth/* (login/refresh/logout).
// Đã gồm withApiError bên trong, route không cần bọc thêm lớp nào.
//
//   export const GET = withMobileRoute(async (req, userId) => { ... });
//   export const PATCH = withMobileRoute(
//     async (req, userId, { params }: { params: Promise<{ id: string }> }) => { ... }
//   );
export function withMobileRoute<Args extends unknown[]>(
  handler: (req: NextRequest, userId: string, ...args: Args) => Promise<NextResponse>
) {
  return withApiError(async (req: NextRequest, ...args: Args) => {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return handler(req, userId, ...args);
  });
}
