"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ScrollCard } from "@/components/tang-kinh-cac/ui";
import { apiFetch } from "@/lib/clientFetch";

type Progress = {
  year: number;
  targetBooks: number | null;
  targetPages: number | null;
  note: string | null;
  booksRead: number;
  pagesRead: number;
};

export default function ReadingGoalPage() {
  const year = new Date().getFullYear();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [targetBooks, setTargetBooks] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    const data = await apiFetch<Progress>(`/api/tang-kinh-cac/reading-goals/${year}`);
    if (!data) return;
    setProgress(data);
    setTargetBooks(data.targetBooks != null ? String(data.targetBooks) : "");
    setNote(data.note ?? "");
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    const saved = await apiFetch("/api/tang-kinh-cac/reading-goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, targetBooks: targetBooks ? Number(targetBooks) : null, note: note || null }),
    });
    if (saved) load();
  }

  const pct =
    progress?.targetBooks && progress.targetBooks > 0
      ? Math.min(100, Math.round((progress.booksRead / progress.targetBooks) * 100))
      : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ScrollCard glow="kincha">
        <div className="mb-4 font-sans text-xs uppercase tracking-wider text-kincha-400/80">
          Tiến độ {year}
        </div>
        <div className="flex items-center gap-6">
          <div className="relative h-32 w-32 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="var(--color-kincha-400)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 42}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - pct / 100) }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif-display text-2xl text-white">{pct}%</span>
            </div>
          </div>
          <div>
            <p className="font-serif-display text-xl text-white">
              {progress?.booksRead ?? 0}
              <span className="text-white/40"> / {progress?.targetBooks ?? "?"} sách</span>
            </p>
            <p className="mt-1 text-sm text-white/50">{progress?.pagesRead ?? 0} trang đã đọc</p>
            {progress?.note && <p className="mt-2 text-sm italic text-yugen-300">{progress.note}</p>}
          </div>
        </div>
      </ScrollCard>

      <ScrollCard glow="yugen">
        <div className="mb-4 font-sans text-xs uppercase tracking-wider text-yugen-300/80">
          Đặt mục tiêu cho {year}
        </div>
        <div className="space-y-3">
          <input
            type="number"
            className="w-full rounded-sm border border-white/15 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-kincha-400/60 focus:outline-none"
            placeholder="Số sách muốn đọc"
            value={targetBooks}
            onChange={(e) => setTargetBooks(e.target.value)}
          />
          <textarea
            rows={2}
            className="w-full rounded-sm border border-white/15 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-kincha-400/60 focus:outline-none"
            placeholder="Ghi chú định hướng đọc năm nay..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button onClick={save} className="w-full rounded-sm bg-kincha-400 py-2 text-sm font-medium text-ink-950">
            Lưu mục tiêu
          </button>
        </div>
      </ScrollCard>
    </div>
  );
}
