import { NextRequest, NextResponse } from "next/server";
import { withApiError } from "@/lib/apiError";
import { getUserId } from "@/lib/mobile-auth";

// Xác thực dùng chung cho web (cookie NextAuth) và Flutter (Bearer JWT) —
// getUserId thử cookie trước, fallback sang Bearer. Bắt buộc cho mọi route
// cần đăng nhập nằm dưới prefix mà proxy.ts bỏ qua (/api/mobile/*,
// /api/kieu-lau/*), nếu không route sẽ mở công khai.
// Không dùng cho /api/mobile/auth/* (login/refresh/logout).
// Đã gồm withApiError bên trong, route không cần bọc thêm lớp nào.
//
//   export const GET = withAuth(async (req, userId) => { ... });
//   export const PATCH = withAuth(
//     async (req, userId, { params }: { params: Promise<{ id: string }> }) => { ... }
//   );
export function withAuth<Args extends unknown[]>(
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
