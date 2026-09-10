import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  name: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  // App cá nhân — chỉ cho đăng ký khi CHƯA có user nào, tránh việc URL public bị lộ
  // là ai cũng tạo được tài khoản. Muốn thêm user thứ 2 (VD vợ/chồng cùng dùng), tạo
  // trực tiếp qua DB hoặc thêm 1 trang admin riêng sau này.
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Đăng ký đã đóng — app này chỉ dùng cho 1 tài khoản." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const [created] = await db
    .insert(users)
    .values({ email: parsed.data.email, name: parsed.data.name, passwordHash })
    .returning({ id: users.id, email: users.email });

  return NextResponse.json(created, { status: 201 });
}
