import { createHash, randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const secret = new TextEncoder().encode(process.env.MOBILE_JWT_SECRET!);

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Helper dùng chung cho route sau này (chưa route nào gọi trong lượt này) —
// thử session cookie NextAuth trước (web), fallback sang Authorization: Bearer
// verify bằng JWT riêng của mobile nếu cookie không có.
export async function getUserId(req: NextRequest): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length).trim();
  return verifyAccessToken(token);
}
