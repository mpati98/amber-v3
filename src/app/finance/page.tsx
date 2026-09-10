"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type FinanceProject = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  archivedAt: string | null;
};

export default function FinanceListPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<FinanceProject[] | null>(null);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/finance/projects");
    setProjects(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startCurrentMonth = async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/finance/projects", { method: "POST" });
      const project = await res.json();
      router.push(`/finance/${project.id}`);
    } finally {
      setStarting(false);
    }
  };

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const hasCurrentMonth = projects?.some((p) => p.startDate.slice(0, 7) === currentMonthKey);

  return (
    <main className="p-4 max-w-2xl mx-auto bg-bg-light min-h-screen">
      <div className="flex items-center justify-between mb-1 text-[11px] text-text-secondary">
        <Link href="/nghi-su-duong" className="text-primary-500">
          ← Nghị Sự Đường
        </Link>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-primary-900 tracking-wide">Tài chính cá nhân</h1>
        {!hasCurrentMonth && (
          <Button size="sm" onClick={startCurrentMonth} disabled={starting}>
            {starting ? "Đang tạo..." : "+ Bắt đầu tháng mới"}
          </Button>
        )}
      </div>

      {projects === null ? (
        <p className="text-[12px] text-text-secondary">Đang tải...</p>
      ) : projects.length === 0 ? (
        <p className="text-[12px] text-text-secondary">
          Chưa có dự án tài chính nào — bấm "Bắt đầu tháng mới" để tạo dự án cho tháng hiện tại.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/finance/${p.id}`}
              className="rounded-xl bg-white border border-primary-100 p-3 flex items-center justify-between hover:border-primary-300 transition-colors"
            >
              <div>
                <p className="text-[13px] text-primary-900 font-medium">{p.name}</p>
                <p className="text-[11px] text-text-secondary">
                  {new Date(p.startDate).toLocaleDateString("vi-VN")} → {new Date(p.endDate).toLocaleDateString("vi-VN")}
                </p>
              </div>
              {!p.archivedAt && (
                <span className="text-[10px] rounded-full bg-primary-50 text-primary-700 px-2 py-0.5">Đang mở</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
