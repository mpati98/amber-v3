import { db } from "@/db";
import { users } from "@/db/schema";
import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";

export default async function RegisterPage() {
  const existing = await db.select({ id: users.id }).from(users).limit(1);

  if (existing.length > 0) {
    return (
      <div className="max-w-sm mx-auto mt-16 p-4 text-center">
        <p className="text-[13px] text-text-secondary mb-3">
          App này đã có tài khoản — đăng ký chỉ mở cho lần dùng đầu tiên.
        </p>
        <Link href="/login" className="text-[13px] text-primary-700 underline">
          Đến trang đăng nhập
        </Link>
      </div>
    );
  }

  return <RegisterForm />;
}
