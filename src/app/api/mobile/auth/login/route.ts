import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { refreshTokens, users } from "@/db/schema";
import { generateRefreshToken, hashRefreshToken, signAccessToken } from "@/lib/mobile-auth";
import { withApiError } from "@/lib/apiError";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Hash của 1 chuỗi ngẫu nhiên bất kỳ, KHÔNG phải hash thật của user nào — chỉ dùng để
// bcrypt.compare có việc để làm khi user không tồn tại, tránh timing attack lộ email nào có
// trong hệ thống (nhánh "sai email" và "sai password" phải mất thời gian như nhau).
const DUMMY_HASH = await bcrypt.hash("dummy-password-for-timing-safety", 10);

export const POST = withApiError(async (req: NextRequest) => {
  const { email, password } = await req.json();
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const accessToken = await signAccessToken(user.id);
  const refreshToken = generateRefreshToken();

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
  });

  return NextResponse.json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name },
  });
});
