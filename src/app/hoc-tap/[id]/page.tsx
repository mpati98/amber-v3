"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollCard } from "@/components/tang-kinh-cac/ui";
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
      <main className="min-h-screen bg-ink-950 p-4 text-white sm:p-6 lg:p-8">
        <p className="font-sans text-[12px] text-white/40">Đang tải...</p>
      </main>
    );
  }

  const totalMinutes = lessons.reduce((s, l) => s + (l.durationMinutes ?? 0), 0);

  return (
    <main className="min-h-screen bg-ink-950 p-4 pb-24 text-white sm:p-6 lg:p-8">
      <Link href="/hoc-tap" className="font-sans text-[11px] text-kincha-400 hover:text-kincha-200">
        ← Học tập
      </Link>

      <h1 className="mt-1 mb-1 font-serif-display text-xl font-semibold tracking-wide text-white">{course.name}</h1>
      <p className="mb-4 font-sans text-[12px] text-white/40">
        {[course.learnDetails?.source, course.learnDetails?.field].filter(Boolean).join(" · ") || "—"}
      </p>

      <div className="mb-4 flex gap-1.5">
        {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={course.learnDetails?.status === s ? "default" : "secondary"}
            onClick={() => setStatus(s)}
            className={
              course.learnDetails?.status === s
                ? "bg-kincha-400 text-ink-950 hover:bg-kincha-400/80"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }
          >
            {STATUS_LABEL[s]}
          </Button>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <ScrollCard glow="kincha" className="p-3">
          <p className="mb-1 font-sans text-[11px] text-white/40">Số bài đã học</p>
          <p className="font-serif-display text-base font-semibold text-white">{lessons.length}</p>
        </ScrollCard>
        <ScrollCard glow="yugen" className="p-3">
          <p className="mb-1 font-sans text-[11px] text-white/40">Tổng thời lượng</p>
          <p className="font-serif-display text-base font-semibold text-white">
            {Math.round(totalMinutes / 60)}h {totalMinutes % 60}p
          </p>
        </ScrollCard>
      </div>

      <ScrollCard glow="yugen" className="mb-6">
        <h2 className="mb-2 font-sans text-[12px] font-medium tracking-wide text-kincha-400">Kết quả đạt được</h2>
        <textarea
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          onBlur={saveOutcome}
          placeholder="Chứng chỉ, điểm số, tổng kết..."
          rows={2}
          className="w-full rounded-sm border border-white/15 bg-white/5 px-2.5 py-1.5 text-[13px] text-white placeholder:text-white/30 outline-none focus-visible:border-kincha-400/50"
        />
      </ScrollCard>

      <ScrollCard glow="shuiro">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-sans text-[12px] font-medium tracking-wide text-kincha-400">Bài học</h2>
          <button onClick={() => setAddLessonOpen(true)} className="text-[11px] text-kincha-400 hover:underline">
            + Thêm bài học
          </button>
        </div>
        {lessons.length === 0 ? (
          <p className="font-sans text-[12px] text-white/40">Chưa có bài học nào.</p>
        ) : (
          <div>
            {lessons.map((l) => (
              <div key={l.id} className="group flex items-center justify-between border-b border-white/10 py-2 last:border-0">
                <div className="min-w-0">
                  <p className="truncate font-sans text-[13px] text-white">{l.title}</p>
                  <p className="font-sans text-[11px] text-white/40">
                    {l.studiedAt ? new Date(l.studiedAt).toLocaleDateString("vi-VN") : "—"}
                    {l.durationMinutes ? ` · ${l.durationMinutes} phút` : ""}
                    {l.note ? ` · ${l.note}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => deleteLesson(l.id)}
                  className="shrink-0 font-sans text-[11px] text-white/40 opacity-0 transition-opacity group-hover:opacity-100 hover:text-shuiro-500"
                >
                  Xoá
                </button>
              </div>
            ))}
          </div>
        )}
      </ScrollCard>

      <AddLessonModal open={addLessonOpen} onClose={() => setAddLessonOpen(false)} courseId={id} onCreated={load} />
    </main>
  );
}
