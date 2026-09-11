"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AddCourseModal } from "@/components/learn/AddCourseModal";

type Course = {
  id: string;
  name: string;
  archivedAt: string | null;
  learnDetails: { source: string | null; field: string | null; status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" } | null;
  learnLessons: { id: string }[];
};

type Lesson = {
  id: string;
  title: string;
  studiedAt: string | null;
  durationMinutes: number | null;
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PLANNED: { label: "Dự định", color: "text-white/40" },
  IN_PROGRESS: { label: "Đang học", color: "text-kincha-400" },
  COMPLETED: { label: "Đã xong", color: "text-emerald-300" },
};

export default function LearnListPage() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lessonsById, setLessonsById] = useState<Record<string, Lesson[]>>({});

  const load = useCallback(async () => {
    const res = await fetch("/api/learn/courses");
    setCourses(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selectedId || lessonsById[selectedId]) return;
    fetch(`/api/learn/courses/${selectedId}/lessons`)
      .then((r) => r.json())
      .then((rows: Lesson[]) => setLessonsById((prev) => ({ ...prev, [selectedId]: rows })));
  }, [selectedId, lessonsById]);

  return (
    <main className="min-h-screen bg-ink-950 p-4 text-white sm:p-6 lg:p-8">
      <div className="mb-4 flex items-center justify-between font-sans text-[11px] text-white/40">
        <Link href="/nghi-su-duong" className="text-kincha-400 hover:text-kincha-200">
          ← Nghị Sự Đường
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-serif-display text-xl font-semibold tracking-wide text-white">Học tập</h1>
        <Button size="sm" onClick={() => setAddOpen(true)} className="bg-kincha-400 text-ink-950 hover:bg-kincha-400/80">
          + Thêm khóa học
        </Button>
      </div>

      {courses === null ? (
        <p className="font-sans text-[12px] text-white/40">Đang tải...</p>
      ) : courses.length === 0 ? (
        <p className="font-sans text-[12px] text-white/40">Chưa có khóa học nào.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {courses.map((c) => {
            const status = c.learnDetails?.status ?? "PLANNED";
            const s = STATUS_LABEL[status];
            const isSelected = c.id === selectedId;
            const lessons = lessonsById[c.id];
            const totalMinutes = lessons?.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0) ?? 0;

            return (
              <motion.button
                key={c.id}
                layout
                type="button"
                onClick={() => setSelectedId((cur) => (cur === c.id ? null : c.id))}
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
                  <p className="font-sans text-[13px] font-medium text-white">{c.name}</p>
                  <span className={`shrink-0 font-sans text-[11px] font-medium ${s.color}`}>{s.label}</span>
                </div>
                <p className="font-sans text-[11px] text-white/40">
                  {[c.learnDetails?.source, c.learnDetails?.field].filter(Boolean).join(" · ") || "—"} ·{" "}
                  {c.learnLessons.length} bài học
                </p>

                {isSelected && (
                  <div className="mt-3 border-t border-white/10 pt-3">
                    {!lessons ? (
                      <p className="font-sans text-[12px] text-white/40">Đang tải...</p>
                    ) : (
                      <>
                        <div className="mb-3 grid grid-cols-2 gap-2">
                          <div>
                            <p className="font-sans text-[10px] text-white/40">Tổng thời lượng</p>
                            <p className="font-sans text-[13px] font-semibold text-white">
                              {Math.round(totalMinutes / 60)}h {totalMinutes % 60}p
                            </p>
                          </div>
                          <div>
                            <p className="font-sans text-[10px] text-white/40">Bài gần nhất</p>
                            <p className="truncate font-sans text-[13px] font-semibold text-white">
                              {lessons[0]?.title ?? "—"}
                            </p>
                          </div>
                        </div>
                        {lessons.length > 0 && (
                          <ul className="mb-3 flex flex-col gap-1">
                            {lessons.slice(0, 3).map((l) => (
                              <li key={l.id} className="truncate font-sans text-[11px] text-white/40">
                                • {l.title}
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                    <Link
                      href={`/hoc-tap/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-block font-sans text-[11px] text-kincha-400 hover:underline"
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

      <AddCourseModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={load} />
    </main>
  );
}
