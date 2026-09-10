"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AddCourseModal } from "@/components/learn/AddCourseModal";

type Course = {
  id: string;
  name: string;
  archivedAt: string | null;
  learnDetails: { source: string | null; field: string | null; status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" } | null;
  learnLessons: { id: string }[];
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PLANNED: { label: "Dự định", color: "text-text-secondary" },
  IN_PROGRESS: { label: "Đang học", color: "text-primary-700" },
  COMPLETED: { label: "Đã xong", color: "text-accent-700" },
};

export default function LearnListPage() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/learn/courses");
    setCourses(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="p-4 max-w-2xl mx-auto bg-bg-light min-h-screen">
      <div className="flex items-center justify-between mb-1 text-[11px] text-text-secondary">
        <Link href="/nghi-su-duong" className="text-primary-500">
          ← Nghị Sự Đường
        </Link>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-primary-900 tracking-wide">Học tập</h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          + Thêm khóa học
        </Button>
      </div>

      {courses === null ? (
        <p className="text-[12px] text-text-secondary">Đang tải...</p>
      ) : courses.length === 0 ? (
        <p className="text-[12px] text-text-secondary">Chưa có khóa học nào.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {courses.map((c) => {
            const status = c.learnDetails?.status ?? "PLANNED";
            const s = STATUS_LABEL[status];
            return (
              <Link
                key={c.id}
                href={`/hoc-tap/${c.id}`}
                className="rounded-xl bg-white border border-primary-100 p-3 flex items-center justify-between hover:border-primary-300 transition-colors"
              >
                <div>
                  <p className="text-[13px] text-primary-900 font-medium">{c.name}</p>
                  <p className="text-[11px] text-text-secondary">
                    {[c.learnDetails?.source, c.learnDetails?.field].filter(Boolean).join(" · ") || "—"} ·{" "}
                    {c.learnLessons.length} bài học
                  </p>
                </div>
                <span className={`text-[11px] font-medium ${s.color}`}>{s.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      <AddCourseModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={load} />
    </main>
  );
}
