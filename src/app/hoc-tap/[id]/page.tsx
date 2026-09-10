"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AddLessonModal } from "@/components/learn/AddLessonModal";

type Status = "PLANNED" | "IN_PROGRESS" | "COMPLETED";

const STATUS_LABEL: Record<Status, string> = {
  PLANNED: "Dự định học",
  IN_PROGRESS: "Đang học",
  COMPLETED: "Đã xong",
};

type Course = {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  learnDetails: { source: string | null; field: string | null; outcome: string | null; status: Status } | null;
};

type Lesson = {
  id: string;
  title: string;
  studiedAt: string | null;
  durationMinutes: number | null;
  note: string | null;
};

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [outcome, setOutcome] = useState("");
  const [addLessonOpen, setAddLessonOpen] = useState(false);

  const load = useCallback(async () => {
    const [coursesRes, lessonsRes] = await Promise.all([
      fetch("/api/learn/courses"),
      fetch(`/api/learn/courses/${id}/lessons`),
    ]);
    const allCourses: Course[] = await coursesRes.json();
    const found = allCourses.find((c) => c.id === id) ?? null;
    setCourse(found);
    setOutcome(found?.learnDetails?.outcome ?? "");
    setLessons(await lessonsRes.json());
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (status: Status) => {
    await fetch(`/api/learn/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        startDate: status === "IN_PROGRESS" && !course?.startDate ? new Date().toISOString().slice(0, 10) : undefined,
        endDate: status === "COMPLETED" ? new Date().toISOString().slice(0, 10) : undefined,
      }),
    });
    load();
  };

  const saveOutcome = async () => {
    await fetch(`/api/learn/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
  };

  const deleteLesson = async (lessonId: string) => {
    await fetch(`/api/learn/lessons/${lessonId}`, { method: "DELETE" });
    load();
  };

  if (!course) {
    return (
      <main className="p-4 max-w-2xl mx-auto bg-bg-light min-h-screen">
        <p className="text-[12px] text-text-secondary">Đang tải...</p>
      </main>
    );
  }

  const totalMinutes = lessons.reduce((s, l) => s + (l.durationMinutes ?? 0), 0);

  return (
    <main className="p-4 max-w-2xl mx-auto bg-bg-light min-h-screen pb-24">
      <Link href="/hoc-tap" className="text-[11px] text-primary-500">
        ← Học tập
      </Link>

      <h1 className="text-lg font-semibold text-primary-900 tracking-wide mt-1 mb-1">{course.name}</h1>
      <p className="text-[12px] text-text-secondary mb-4">
        {[course.learnDetails?.source, course.learnDetails?.field].filter(Boolean).join(" · ") || "—"}
      </p>

      <div className="flex gap-1.5 mb-4">
        {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={course.learnDetails?.status === s ? "default" : "secondary"}
            onClick={() => setStatus(s)}
          >
            {STATUS_LABEL[s]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl bg-white border border-primary-100 p-3">
          <p className="text-[11px] text-text-secondary mb-1">Số bài đã học</p>
          <p className="text-base font-semibold text-primary-900">{lessons.length}</p>
        </div>
        <div className="rounded-xl bg-white border border-primary-100 p-3">
          <p className="text-[11px] text-text-secondary mb-1">Tổng thời lượng</p>
          <p className="text-base font-semibold text-primary-900">{Math.round(totalMinutes / 60)}h {totalMinutes % 60}p</p>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="text-[12px] font-medium text-primary-700 mb-2">Kết quả đạt được</h2>
        <textarea
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          onBlur={saveOutcome}
          placeholder="Chứng chỉ, điểm số, tổng kết..."
          rows={2}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-[13px] outline-none focus-visible:border-ring"
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[12px] font-medium text-primary-700">Bài học</h2>
          <button onClick={() => setAddLessonOpen(true)} className="text-[11px] text-primary-500">
            + Thêm bài học
          </button>
        </div>
        {lessons.length === 0 ? (
          <p className="text-[12px] text-text-secondary">Chưa có bài học nào.</p>
        ) : (
          <div className="rounded-xl bg-white border border-primary-100 px-3">
            {lessons.map((l) => (
              <div key={l.id} className="flex items-center justify-between py-2 border-b border-primary-100 last:border-0 group">
                <div className="min-w-0">
                  <p className="text-[13px] text-primary-900 truncate">{l.title}</p>
                  <p className="text-[11px] text-text-secondary">
                    {l.studiedAt ? new Date(l.studiedAt).toLocaleDateString("vi-VN") : "—"}
                    {l.durationMinutes ? ` · ${l.durationMinutes} phút` : ""}
                    {l.note ? ` · ${l.note}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => deleteLesson(l.id)}
                  className="opacity-0 group-hover:opacity-100 text-[11px] text-text-secondary hover:text-accent-700 transition-opacity shrink-0"
                >
                  Xoá
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <AddLessonModal open={addLessonOpen} onClose={() => setAddLessonOpen(false)} courseId={id} onCreated={load} />
    </main>
  );
}
