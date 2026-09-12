"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ScrollCard, ProgressBar } from "@/components/tang-kinh-cac/ui";
import { formatVND } from "@/lib/currency";

type DuAnOverview = {
  activeProjects: { id: string; name: string; progressPct: number; totalTasks: number }[];
  completedThisYear: number;
  upcomingProject: { id: string; name: string; startDate: string } | null;
};

type FinanceOverview = {
  currentBalance: number;
  totalIncome: number;
  totalExpense: number;
  activeProjectId: string | null;
  activeProjectName: string | null;
};

type LearnOverview = {
  totalCourses: number;
  completedThisYear: number;
  currentCourse: { id: string; name: string; lastLessonTitle: string | null } | null;
  nextPlannedCourse: { id: string; name: string } | null;
};

export default function NghiSuDuongHub() {
  const [duAn, setDuAn] = useState<DuAnOverview | null>(null);
  const [finance, setFinance] = useState<FinanceOverview | null>(null);
  const [learn, setLearn] = useState<LearnOverview | null>(null);

  useEffect(() => {
    fetch("/api/du-an/overview").then((r) => r.json()).then(setDuAn);
    fetch("/api/finance/overview").then((r) => r.json()).then(setFinance);
    fetch("/api/learn/overview").then((r) => r.json()).then(setLearn);
  }, []);

  return (
    <div className="min-h-screen bg-ink-950 pb-24 text-white">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <div>
          <div className="font-serif-display text-sm italic tracking-wide text-kincha-400">
            âm dương giới
          </div>
          <h1 className="mt-1 font-serif-display text-2xl font-semibold sm:text-3xl">
            Nghị Sự Đường
          </h1>
        </div>
        <Link
          href="/"
          className="rounded-sm border border-white/15 px-4 py-2 font-sans text-sm text-white/70 transition hover:border-kincha-400/50 hover:text-kincha-200"
        >
          ← Âm Dương Giới
        </Link>
      </header>

      <main className="grid gap-5 px-6 py-4 sm:grid-cols-2 sm:px-10 lg:grid-cols-3">
        {/* Dự án thông thường */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Link href="/du-an" className="block h-full">
            <ScrollCard glow="yugen" className="h-full">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-serif-display text-lg text-white">📋 Dự án thông thường</h2>
                <span className="font-sans text-[11px] text-white/40">
                  {duAn?.completedThisYear ?? 0} xong năm nay
                </span>
              </div>
              {!duAn?.activeProjects.length ? (
                <p className="font-sans text-sm text-white/40">Chưa có dự án nào đang triển khai.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {duAn.activeProjects.slice(0, 3).map((p) => (
                    <div key={p.id}>
                      <div className="mb-1 flex items-center justify-between font-sans text-xs">
                        <span className="truncate text-white/80">{p.name}</span>
                        <span className="shrink-0 text-white/40">{p.progressPct}%</span>
                      </div>
                      <ProgressBar value={p.progressPct} max={100} />
                    </div>
                  ))}
                </div>
              )}
              {duAn?.upcomingProject && (
                <p className="mt-3 font-sans text-xs text-white/40">
                  Sắp tới: {duAn.upcomingProject.name} (
                  {new Date(duAn.upcomingProject.startDate).toLocaleDateString("vi-VN")})
                </p>
              )}
            </ScrollCard>
          </Link>
        </motion.div>

        {/* Finance */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Link href="/finance" className="block h-full">
            <ScrollCard glow="kincha" className="h-full">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-serif-display text-lg text-white">💰 Tài chính</h2>
                {finance?.activeProjectName && (
                  <span className="font-sans text-[11px] text-white/40">{finance.activeProjectName}</span>
                )}
              </div>
              <p className="font-serif-display text-2xl text-kincha-400">
                {formatVND(finance?.currentBalance ?? 0)}
              </p>
              <div className="mt-2 flex items-center gap-3 font-sans text-xs">
                <span className="text-emerald-300">+{formatVND(finance?.totalIncome ?? 0)}</span>
                <span className="text-shuiro-500">−{formatVND(finance?.totalExpense ?? 0)}</span>
              </div>
            </ScrollCard>
          </Link>
        </motion.div>

        {/* Learn */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Link href="/hoc-tap" className="block h-full">
            <ScrollCard glow="shuiro" className="h-full">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-serif-display text-lg text-white">🎓 Học tập</h2>
                <span className="font-sans text-[11px] text-white/40">
                  {learn?.completedThisYear ?? 0} khóa xong năm nay
                </span>
              </div>
              {learn?.currentCourse ? (
                <div>
                  <p className="font-sans text-sm text-white/80">Đang học: {learn.currentCourse.name}</p>
                  {learn.currentCourse.lastLessonTitle && (
                    <p className="mt-1 font-sans text-xs text-white/40">
                      Gần nhất: {learn.currentCourse.lastLessonTitle}
                    </p>
                  )}
                </div>
              ) : (
                <p className="font-sans text-sm text-white/40">Chưa có khóa nào đang học.</p>
              )}
              {learn?.nextPlannedCourse && (
                <p className="mt-2 font-sans text-xs text-white/40">
                  Sắp tới: {learn.nextPlannedCourse.name}
                </p>
              )}
            </ScrollCard>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
