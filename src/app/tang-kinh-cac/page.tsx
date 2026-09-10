"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ScrollCard } from "@/components/tang-kinh-cac/ui";
import SectionCard from "@/components/tang-kinh-cac/SectionCard";

type HighlightResurface = {
  quote: string;
  publication?: { title: string; author: string | null };
};

type GoalProgress = {
  year: number;
  targetBooks: number | null;
  booksRead: number;
};

export default function TangKinhCacHub() {
  const [highlight, setHighlight] = useState<HighlightResurface | null>(null);
  const [goal, setGoal] = useState<GoalProgress | null>(null);
  const [counts, setCounts] = useState({
    reading: 0,
    read: 0,
    toRead: 0,
    documents: 0,
  });

  useEffect(() => {
    const year = new Date().getFullYear();
    fetch("/api/tang-kinh-cac/highlights/random")
      .then((r) => r.json())
      .then(setHighlight);
    fetch(`/api/tang-kinh-cac/reading-goals/${year}`)
      .then((r) => r.json())
      .then(setGoal);
    fetch("/api/tang-kinh-cac/publications")
      .then((r) => r.json())
      .then((items) => {
        setCounts((c) => ({
          ...c,
          reading: items.filter(
            (p: { status: string }) => p.status === "READING",
          ).length,
          read: items.filter((p: { status: string }) => p.status === "READ")
            .length,
          toRead: items.filter(
            (p: { status: string }) => p.status === "TO_READ",
          ).length,
        }));
      });
    fetch("/api/tang-kinh-cac/documents")
      .then((r) => r.json())
      .then((items) => {
        setCounts((c) => ({ ...c, documents: items.length }));
      });
  }, []);

  return (
    <div className="space-y-8">
      {highlight && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ScrollCard glow="kincha">
            <div className="mb-2 font-sans text-xs uppercase tracking-wider text-kincha-400/80">
              Ôn lại
            </div>
            <p className="font-serif-display text-base italic leading-relaxed text-white/85">
              "{highlight.quote}"
            </p>
            {highlight.publication && (
              <p className="mt-2 text-sm text-white/40">
                — {highlight.publication.title}
                {highlight.publication.author
                  ? `, ${highlight.publication.author}`
                  : ""}
              </p>
            )}
          </ScrollCard>
        </motion.div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <SectionCard
          index={0}
          href="/tang-kinh-cac/sach"
          icon="📚"
          title="Sách"
          description="Thư viện sách đang đọc, đã đọc và muốn đọc — kèm review và highlight."
          stat={`${counts.reading} đang đọc · ${counts.read} đã đọc · ${counts.toRead} muốn đọc`}
          glow="kincha"
        />
        <SectionCard
          index={1}
          href="/tang-kinh-cac/tai-lieu"
          icon="🗂"
          title="Tài liệu"
          description="Ghi chú, checklist, mindmap, hình ảnh và tệp bạn muốn lưu lại để xem sau."
          stat={`${counts.documents} tài liệu đã lưu`}
          glow="yugen"
        />
        <SectionCard
          index={2}
          href="/tang-kinh-cac/ke-hoach-doc"
          icon="🎯"
          title="Kế hoạch đọc"
          description="Đặt mục tiêu đọc theo năm và theo dõi tiến độ."
          stat={
            goal?.targetBooks
              ? `${goal.booksRead}/${goal.targetBooks} sách năm ${goal.year}`
              : "Chưa đặt mục tiêu"
          }
          glow="shuiro"
        />
      </div>
    </div>
  );
}
