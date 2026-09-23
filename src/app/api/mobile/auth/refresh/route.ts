import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { refreshTokens } from "@/db/schema";
import { generateRefreshToken, hashRefreshToken, signAccessToken } from "@/lib/mobile-auth";
import { withApiError } from "@/lib/apiError";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const POST = withApiError(async (req: NextRequest) => {
  const { refreshToken } = await req.json();
  if (typeof refreshToken !== "string") {
    return NextResponse.json({ error: "invalid_refresh_token" }, { status: 401 });
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const [existing] = await db
    .select()
    .from(refreshTokens)
    .where(and(eq(refreshTokens.tokenHash, tokenHash), gt(refreshTokens.expiresAt, new Date())));

  if (!existing) {
    return NextResponse.json({ error: "invalid_refresh_token" }, { status: 401 });
  }

  // Rotation: xóa refresh token cũ trước khi cấp cặp mới, không tái sử dụng được nữa.
  await db.delete(refreshTokens).where(eq(refreshTokens.id, existing.id));

  const newAccessToken = await signAccessToken(existing.userId);
  const newRefreshToken = generateRefreshToken();

  await db.insert(refreshTokens).values({
    userId: existing.userId,
    tokenHash: hashRefreshToken(newRefreshToken),
    expiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
  });

  return NextResponse.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
});
