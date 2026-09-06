import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const genericResponse = NextResponse.json({
    message:
      "Nếu email tồn tại trong hệ thống, một link đặt lại mật khẩu đã được gửi.",
  });

  if (!email) return genericResponse;

  const admin = await prisma.adminAccount.findUnique({ where: { email } });
  if (!admin) return genericResponse; // không tiết lộ email có tồn tại hay không

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  await prisma.adminAccount.update({
    where: { id: admin.id },
    data: {
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 phút
    },
  });

  const resetUrl = `${process.env.APP_URL}/reset-password?token=${rawToken}`;

  await resend.emails.send({
    from: "Amber <onboarding@resend.dev>", // đổi sau khi verify domain riêng trên Resend
    to: email,
    subject: "Đặt lại mật khẩu — Amber",
    html: `<p>Bấm vào link sau để đặt lại mật khẩu (hết hạn sau 30 phút):</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>
           <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
  });

  return genericResponse;
}
