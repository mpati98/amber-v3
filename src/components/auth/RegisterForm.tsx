"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Đăng ký thất bại.");
      }
      // Tạo xong thì đăng nhập luôn, không bắt gõ lại
      const signInRes = await signIn("credentials", { email, password, redirect: false });
      if (signInRes?.error)
        throw new Error("Tạo tài khoản xong nhưng đăng nhập tự động thất bại, vào /login thử lại.");
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16 p-4">
      <h1 className="text-lg font-semibold text-primary-900 mb-1">Tạo tài khoản</h1>
      <p className="text-[12px] text-text-secondary mb-4">
        App cá nhân — chỉ tạo được 1 tài khoản duy nhất.
      </p>
      <div className="flex flex-col gap-1 mb-2">
        <Label htmlFor="name">Tên hiển thị</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tuỳ chọn" />
      </div>
      <div className="flex flex-col gap-1 mb-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="flex flex-col gap-1 mb-3">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Tối thiểu 8 ký tự"
        />
      </div>
      {error && <p className="text-[12px] text-accent-700 mb-2">{error}</p>}
      <Button onClick={submit} disabled={submitting} className="w-full">
        {submitting ? "Đang tạo..." : "Tạo tài khoản"}
      </Button>
    </div>
  );
}
