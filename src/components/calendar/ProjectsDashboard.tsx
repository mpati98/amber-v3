"use client";

import { useEffect, useState } from "react";
import { ScrollCard, ProgressBar } from "@/components/tang-kinh-cac/ui";
import { TaskStatusBadge, ImportanceTag } from "@/components/calendar/TaskBadges";

type Task = {
  id: string;
  title: string;
  status: string;
  importance: number;
  startDate: string | null;
  dueDate: string | null;
};

type ActiveProject = {
  id: string;
  name: string;
  color: string | null;
  totalTasks: number;
  doneTasks: number;
  progressPct: number;
};

type UpcomingProject = {
  id: string;
  name: string;
  startDate: string | null;
  color: string | null;
};

type Overview = {
  activeProjects: ActiveProject[];
  upcomingProjects: UpcomingProject[];
};

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-sm border border-white/10 bg-ink-900/60 p-3">
      <p className="font-serif-display text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 font-sans text-[11px] text-white/40">{label}</p>
    </div>
  );
}

export function ProjectsDashboard({ userName }: { userName?: string | null }) {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/du-an/overview").then((r) => r.json()),
    ]).then(([tasksData, overviewData]) => {
      setTasks(tasksData);
      setOverview(overviewData);
    });
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks?.filter((t) => t.startDate === today || t.dueDate === today) ?? [];
  const inProgressCount = tasks?.filter((t) => t.status === "IN_PROGRESS").length ?? 0;
  const activeProjects = overview?.activeProjects ?? [];
  const avgProgress =
    activeProjects.length > 0
      ? Math.round(activeProjects.reduce((sum, p) => sum + p.progressPct, 0) / activeProjects.length)
      : 0;
  const upcomingProjects = overview?.upcomingProjects ?? [];

  const dateLabel = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="font-serif-display text-sm italic tracking-wide text-kincha-400">
          {greetingForNow()}
          {userName ? `, ${userName}` : ""}
        </div>
        <p className="mt-1 font-sans text-[12px] text-white/40 capitalize">{dateLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard value={todayTasks.length} label="Task hôm nay" />
        <StatCard value={inProgressCount} label="Đang làm" />
        <StatCard value={activeProjects.length} label="Dự án chạy" />
        <StatCard value={`${avgProgress}%`} label="TB hoàn thành" />
      </div>

      <div className="grid gap-4 sm:grid-cols-[1.3fr_1fr]">
        <ScrollCard glow="kincha">
          <h2 className="mb-3 font-sans text-[12px] font-medium tracking-wide text-kincha-400">Task hôm nay</h2>
          {tasks === null ? (
            <p className="font-sans text-[12px] text-white/40">Đang tải...</p>
          ) : todayTasks.length === 0 ? (
            <p className="font-sans text-[12px] text-white/40">Không có task nào hôm nay.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {todayTasks.map((t) => (
                <div key={t.id} className="flex items-start justify-between gap-2 border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-sans text-[13px] text-white">{t.title}</p>
                    <div className="mt-1.5">
                      <TaskStatusBadge status={t.status} />
                    </div>
                  </div>
                  <ImportanceTag importance={t.importance} />
                </div>
              ))}
            </div>
          )}
        </ScrollCard>

        <div className="flex flex-col gap-4">
          <ScrollCard glow="yugen">
            <h2 className="mb-3 font-sans text-[12px] font-medium tracking-wide text-kincha-400">Dự án đang chạy</h2>
            {overview === null ? (
              <p className="font-sans text-[12px] text-white/40">Đang tải...</p>
            ) : activeProjects.length === 0 ? (
              <p className="font-sans text-[12px] text-white/40">Chưa có dự án nào.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {activeProjects.map((p) => (
                  <div key={p.id}>
                    <div className="mb-1 flex items-center justify-between font-sans text-[12px]">
                      <span className="truncate text-white/80">{p.name}</span>
                      <span className="shrink-0 text-white/40">{p.progressPct}%</span>
                    </div>
                    <ProgressBar value={p.doneTasks} max={p.totalTasks} />
                  </div>
                ))}
              </div>
            )}
          </ScrollCard>

          <ScrollCard glow="shuiro">
            <h2 className="mb-3 font-sans text-[12px] font-medium tracking-wide text-kincha-400">Sắp tới</h2>
            {overview === null ? (
              <p className="font-sans text-[12px] text-white/40">Đang tải...</p>
            ) : upcomingProjects.length === 0 ? (
              <p className="font-sans text-[12px] text-white/40">Chưa có dự án sắp tới.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {upcomingProjects.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 font-sans text-[12px]">
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: p.color ?? "#eccb8a" }}
                    />
                    <span className="min-w-0 flex-1 truncate text-white/80">{p.name}</span>
                    <span className="shrink-0 text-white/40">{p.startDate}</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollCard>
        </div>
      </div>
    </div>
  );
}
