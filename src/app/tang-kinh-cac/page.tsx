"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ScrollCard } from "@/components/tang-kinh-cac/ui";
import { apiFetch } from "@/lib/clientFetch";

type HighlightResurface = {
  id: string;
  quote: string;
  page: number | null;
  note: string | null;
  publication?: { title: string; author: string | null; coverUrl: string | null };
};

type GoalProgress = {
  year: number;
  targetBooks: number | null;
  booksRead: number;
};

export default function TangKinhCacOverview() {
  const [highlight, setHighlight] = useState<HighlightResurface | null>(null);
  const [goal, setGoal] = useState<GoalProgress | null>(null);
  const [counts, setCounts] = useState({ reading: 0, read: 0, documents: 0 });

  useEffect(() => {
    const year = new Date().getFullYear();

    apiFetch<HighlightResurface>("/api/tang-kinh-cac/highlights/random").then(setHighlight);
    apiFetch<GoalProgress>(`/api/tang-kinh-cac/reading-goals/${year}`).then(setGoal);
    apiFetch<{ status: string }[]>("/api/tang-kinh-cac/publications").then((items) => {
      setCounts((c) => ({
        ...c,
        reading: (items ?? []).filter((p) => p.status === "READING").length,
        read: (items ?? []).filter((p) => p.status === "READ").length,
      }));
    });
    apiFetch<unknown[]>("/api/tang-kinh-cac/documents").then((items) => {
      setCounts((c) => ({ ...c, documents: (items ?? []).length }));
    });
  }, []);

  const pct =
    goal?.targetBooks && goal.targetBooks > 0
      ? Math.min(100, Math.round((goal.booksRead / goal.targetBooks) * 100))
      : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="lg:col-span-2"
      >
        <ScrollCard glow="kincha">
          <div className="mb-3 font-sans text-xs uppercase tracking-wider text-kincha-400/80">
            Ôn lại
          </div>
          {highlight ? (
            <>
              <p className="font-serif-display text-lg italic leading-relaxed text-white/90">
                "{highlight.quote}"
              </p>
              <div className="mt-4 flex items-center gap-3 text-sm text-white/50">
                {highlight.publication?.coverUrl && (
                  <img
                    src={highlight.publication.coverUrl}
                    alt=""
                    className="h-12 w-8 rounded-sm object-cover"
                  />
                )}
                <div>
                  <div className="text-white/80">{highlight.publication?.title}</div>
                  <div>{highlight.publication?.author}</div>
                </div>
              </div>
              {highlight.note && (
                <p className="mt-3 border-l-2 border-yugen-500/40 pl-3 text-sm text-yugen-300">
                  {highlight.note}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-white/40">
              Chưa có highlight nào — thêm trích dẫn từ sách bạn đang đọc để chúng xuất hiện lại ở đây.
            </p>
          )}
        </ScrollCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <ScrollCard glow="yugen">
          <div className="mb-3 font-sans text-xs uppercase tracking-wider text-yugen-300/80">
            Kế hoạch đọc {goal?.year}
          </div>
          {goal?.targetBooks ? (
            <>
              <div className="font-serif-display text-3xl text-white">
                {goal.booksRead}
                <span className="text-white/40"> / {goal.targetBooks} sách</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-yugen-500 to-kincha-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <Link href="/tang-kinh-cac/ke-hoach-doc" className="mt-4 inline-block text-sm text-yugen-300 underline">
                Xem chi tiết
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-white/40">Chưa đặt mục tiêu đọc cho năm nay.</p>
              <Link href="/tang-kinh-cac/ke-hoach-doc" className="mt-3 inline-block text-sm text-yugen-300 underline">
                Đặt mục tiêu
              </Link>
            </>
          )}
        </ScrollCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="lg:col-span-3 grid grid-cols-3 gap-4"
      >
        {[
          { label: "Đang đọc", value: counts.reading, href: "/tang-kinh-cac/sach" },
          { label: "Đã đọc", value: counts.read, href: "/tang-kinh-cac/sach" },
          { label: "Tài liệu lưu trữ", value: counts.documents, href: "/tang-kinh-cac/tai-lieu" },
        ].map((s) => (
          <Link key={s.label} href={s.href}>
            <ScrollCard className="text-center">
              <div className="font-serif-display text-3xl text-kincha-400">{s.value}</div>
              <div className="mt-1 font-sans text-xs text-white/50">{s.label}</div>
            </ScrollCard>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
