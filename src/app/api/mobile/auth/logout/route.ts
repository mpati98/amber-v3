import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { refreshTokens } from "@/db/schema";
import { hashRefreshToken } from "@/lib/mobile-auth";
import { withApiError } from "@/lib/apiError";

export const POST = withApiError(async (req: NextRequest) => {
  const { refreshToken } = await req.json();
  if (typeof refreshToken === "string") {
    await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, hashRefreshToken(refreshToken)));
  }
  // Không tìm thấy/đã hết hạn cũng coi như đã logout — luôn trả 200.
  return NextResponse.json({ success: true });
});
