// app/reset-password/page.tsx
"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    setMessage(
      res.ok
        ? "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại."
        : data.error,
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-950 px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 text-white"
      >
        <h1 className="font-serif-display text-2xl">Đặt lại mật khẩu</h1>
        <input
          type="password"
          placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded border border-white/20 bg-transparent px-3 py-2"
        />
        <button
          type="submit"
          className="w-full rounded bg-kincha-400 py-2 text-ink-950"
        >
          Xác nhận
        </button>
        {message && <p className="text-sm text-yugen-300">{message}</p>}
      </form>
    </main>
  );
}
