import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json();
  if (!token || !newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: "Token hoặc mật khẩu không hợp lệ (tối thiểu 8 ký tự)" },
      { status: 400 },
    );
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const admin = await prisma.adminAccount.findFirst({
    where: {
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: { gt: new Date() },
    },
  });

  if (!admin) {
    return NextResponse.json(
      { error: "Link đã hết hạn hoặc không hợp lệ" },
      { status: 400 },
    );
  }

  await prisma.adminAccount.update({
    where: { id: admin.id },
    data: {
      passwordHash: await hashPassword(newPassword),
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
  });

  return NextResponse.json({ success: true });
}
