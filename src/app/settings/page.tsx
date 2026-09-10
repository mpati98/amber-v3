"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const { data: session, update } = useSession();

  const [name, setName] = useState(session?.user?.name ?? "");
  const [nameMsg, setNameMsg] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const saveName = async () => {
    setNameMsg(null);
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      await update({ name });
      setNameMsg("Đã lưu.");
    } else {
      setNameMsg("Lưu thất bại.");
    }
  };

  const changePassword = async () => {
    setPwMsg(null);
    setPwError(null);
    const res = await fetch("/api/user/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) {
      setPwMsg("Đã đổi mật khẩu.");
      setCurrentPassword("");
      setNewPassword("");
    } else {
      const data = await res.json().catch(() => ({}));
      setPwError(typeof data.error === "string" ? data.error : "Đổi mật khẩu thất bại.");
    }
  };

  return (
    <main className="p-4 max-w-md mx-auto bg-bg-light min-h-screen">
      <h1 className="text-lg font-semibold text-primary-900 mb-4">Cài đặt tài khoản</h1>

      <p className="text-[12px] text-text-secondary mb-4">{session?.user?.email}</p>

      <section className="bg-white rounded-lg p-3 mb-4">
        <h2 className="text-[13px] font-medium text-primary-900 mb-2">Tên hiển thị</h2>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="mb-2" />
        {nameMsg && <p className="text-[12px] text-primary-500 mb-2">{nameMsg}</p>}
        <Button onClick={saveName} size="sm">
          Lưu
        </Button>
      </section>

      <section className="bg-white rounded-lg p-3 mb-4">
        <h2 className="text-[13px] font-medium text-primary-900 mb-2">Đổi mật khẩu</h2>
        <Input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Mật khẩu hiện tại"
          className="mb-2"
        />
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Mật khẩu mới"
          className="mb-2"
        />
        {pwError && <p className="text-[12px] text-accent-700 mb-2">{pwError}</p>}
        {pwMsg && <p className="text-[12px] text-primary-500 mb-2">{pwMsg}</p>}
        <Button onClick={changePassword} size="sm">
          Đổi mật khẩu
        </Button>
      </section>

      <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/login" })} className="text-accent-700">
        Đăng xuất
      </Button>
    </main>
  );
}
