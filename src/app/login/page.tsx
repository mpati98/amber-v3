// app/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SceneBackground from "@/components/SceneBackground";
import SceneForeground from "@/components/SceneForeground";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push(params.get("next") || "/");
    } else {
      const data = await res.json();
      setError(data.error || "Đăng nhập thất bại");
      setPending(false);
    }
  }

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-ink-950 px-6">
      <SceneBackground />
      <SceneForeground />

      <div className="relative z-10 w-full max-w-sm animate-[rise_0.6s_ease-out]">
        <form
          onSubmit={handleSubmit}
          className="rounded-sm border px-8 py-9 backdrop-blur-sm"
          style={{
            borderColor: "rgba(236,203,138,0.4)",
            background: "rgba(12,13,30,0.82)",
            boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
          }}
        >
          <span className="block text-center font-serif-display text-sm italic tracking-wide text-kincha-400">
            Khu vực quản trị
          </span>
          <h1 className="mt-1 text-center font-serif-display text-3xl font-semibold text-white">
            Đăng Nhập
          </h1>

          <div className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block font-sans text-xs uppercase tracking-wide text-yugen-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-sm border border-white/15 bg-white/5 px-3 py-2.5 font-sans text-sm text-white outline-none transition placeholder:text-white/30 focus:border-kincha-400/60 focus:bg-white/10"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block font-sans text-xs uppercase tracking-wide text-yugen-300"
              >
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-sm border border-white/15 bg-white/5 px-3 py-2.5 font-sans text-sm text-white outline-none transition placeholder:text-white/30 focus:border-kincha-400/60 focus:bg-white/10"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 font-sans text-sm text-shuiro-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-7 w-full rounded-sm bg-kincha-400 py-2.5 font-sans text-sm font-medium tracking-wide text-ink-950 transition hover:bg-kincha-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>

          <Link
            href="/forgot-password"
            className="mt-5 block text-center font-sans text-sm text-yugen-300 transition hover:text-yugen-500"
          >
            Quên mật khẩu?
          </Link>
        </form>

        <Link
          href="/"
          className="mt-6 block text-center font-sans text-sm text-kincha-200 transition hover:text-kincha-400"
        >
          Quay lại Âm Dương Giới
        </Link>
      </div>
    </main>
  );
}
