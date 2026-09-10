"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setSubmitting(false);

    if (res?.error) {
      setError("Sai email hoặc mật khẩu.");
      return;
    }
    router.push(searchParams.get("callbackUrl") || "/");
  };

  return (
    <div className="max-w-sm mx-auto mt-16 p-4">
      <h1 className="text-lg font-semibold text-primary-900 mb-4">Đăng nhập</h1>
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
          placeholder="••••••••"
        />
      </div>
      {error && <p className="text-[12px] text-accent-700 mb-2">{error}</p>}
      <Button onClick={submit} disabled={submitting} className="w-full">
        {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
