"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/currency";

type FinanceProject = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  archivedAt: string | null;
};

type Summary = {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netThisMonth: number;
};

export default function FinanceListPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<FinanceProject[] | null>(null);
  const [starting, setStarting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, Summary>>({});

  const load = useCallback(async () => {
    const res = await fetch("/api/finance/projects");
    setProjects(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selectedId || previews[selectedId]) return;
    fetch(`/api/finance/summary?projectId=${selectedId}`)
      .then((r) => r.json())
      .then((s) =>
        setPreviews((prev) => ({
          ...prev,
          [selectedId]: {
            totalBalance: s.totalBalance,
            totalIncome: s.totalIncome,
            totalExpense: s.totalExpense,
            netThisMonth: s.netThisMonth,
          },
        }))
      );
  }, [selectedId, previews]);

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
    <main className="min-h-screen bg-ink-950 p-4 text-white sm:p-6 lg:p-8">
      <div className="mb-4 flex items-center justify-between font-sans text-[11px] text-white/40">
        <Link href="/nghi-su-duong" className="text-kincha-400 hover:text-kincha-200">
          ← Nghị Sự Đường
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-serif-display text-xl font-semibold tracking-wide text-white">
          Tài chính cá nhân
        </h1>
        {!hasCurrentMonth && (
          <Button
            size="sm"
            onClick={startCurrentMonth}
            disabled={starting}
            className="bg-kincha-400 text-ink-950 hover:bg-kincha-400/80"
          >
            {starting ? "Đang tạo..." : "+ Bắt đầu tháng mới"}
          </Button>
        )}
      </div>

      {projects === null ? (
        <p className="font-sans text-[12px] text-white/40">Đang tải...</p>
      ) : projects.length === 0 ? (
        <p className="font-sans text-[12px] text-white/40">
          Chưa có dự án tài chính nào — bấm &quot;Bắt đầu tháng mới&quot; để tạo dự án cho tháng hiện tại.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {projects.map((p) => {
            const isSelected = p.id === selectedId;
            const preview = previews[p.id];
            return (
              <motion.button
                key={p.id}
                layout
                type="button"
                onClick={() => setSelectedId((cur) => (cur === p.id ? null : p.id))}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className={`text-left rounded-sm border bg-ink-900/60 p-3 transition-colors ${
                  isSelected
                    ? "flex-3 basis-full border-kincha-400 ring-2 ring-kincha-400 shadow-md"
                    : selectedId
                      ? "flex-[0.6] basis-40 border-white/10"
                      : "flex-1 basis-64 border-white/10 hover:border-white/25"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-sans text-[13px] font-medium text-white">{p.name}</p>
                  {!p.archivedAt && (
                    <span className="shrink-0 rounded-sm border border-yugen-500/40 px-2 py-0.5 font-sans text-[10px] text-yugen-300">
                      Đang mở
                    </span>
                  )}
                </div>
                <p className="font-sans text-[11px] text-white/40">
                  {new Date(p.startDate).toLocaleDateString("vi-VN")} → {new Date(p.endDate).toLocaleDateString("vi-VN")}
                </p>

                {isSelected && (
                  <div className="mt-3 border-t border-white/10 pt-3">
                    {!preview ? (
                      <p className="font-sans text-[12px] text-white/40">Đang tải...</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div>
                          <p className="font-sans text-[10px] text-white/40">Tổng số dư</p>
                          <p className="font-sans text-[13px] font-semibold text-white">{formatVND(preview.totalBalance)}</p>
                        </div>
                        <div>
                          <p className="font-sans text-[10px] text-white/40">Thu tháng này</p>
                          <p className="font-sans text-[13px] font-semibold text-emerald-300">{formatVND(preview.totalIncome)}</p>
                        </div>
                        <div>
                          <p className="font-sans text-[10px] text-white/40">Chi tháng này</p>
                          <p className="font-sans text-[13px] font-semibold text-shuiro-500">{formatVND(preview.totalExpense)}</p>
                        </div>
                        <div>
                          <p className="font-sans text-[10px] text-white/40">Chênh lệch</p>
                          <p
                            className={`font-sans text-[13px] font-semibold ${preview.netThisMonth >= 0 ? "text-emerald-300" : "text-shuiro-500"}`}
                          >
                            {formatVND(preview.netThisMonth)}
                          </p>
                        </div>
                      </div>
                    )}
                    <Link
                      href={`/finance/${p.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 inline-block font-sans text-[11px] text-kincha-400 hover:underline"
                    >
                      Mở đầy đủ →
                    </Link>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </main>
  );
}
