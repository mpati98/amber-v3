import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json(
      { error: "Thiếu email hoặc mật khẩu" },
      { status: 400 },
    );
  }

  const admin = await prisma.adminAccount.findUnique({ where: { email } });
  // Luôn trả lỗi giống nhau dù email đúng hay sai — tránh lộ email nào tồn tại
  const genericError = NextResponse.json(
    { error: "Email hoặc mật khẩu không đúng" },
    { status: 401 },
  );

  if (!admin) return genericError;
  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) return genericError;

  const token = await createSessionToken(admin.id);
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
