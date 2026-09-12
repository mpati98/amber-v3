"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScrollCard, ProgressBar } from "@/components/tang-kinh-cac/ui";
import { NewPracticeSessionModal } from "@/components/tra-dinh/NewPracticeSessionModal";
import { SKILLS, SKILL_LABEL } from "@/lib/skills";

type SkillRow = { skill: string; score: number | null; cefrLevel: string | null };

type PracticeSession = {
  id: string;
  name: string;
  archivedAt: string | null;
  createdAt: string;
  practiceDetails: { mode: string; summary: string | null } | null;
};

const MODE_LABEL: Record<string, string> = {
  CONVERSATION: "Trò chuyện tự do",
  EXAM_PREP: "Luyện thi",
  PROFESSIONAL: "Chuyên nghiệp",
};

export default function TraDinhHub() {
  const router = useRouter();
  const [skills, setSkills] = useState<SkillRow[] | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[] | null>(null);
  const [newSessionOpen, setNewSessionOpen] = useState(false);

  const loadSkills = useCallback(async () => {
    const res = await fetch("/api/tra-dinh/skills");
    setSkills(await res.json());
  }, []);

  const loadSessions = useCallback(async () => {
    const res = await fetch("/api/tra-dinh/sessions");
    setSessions(await res.json());
  }, []);

  useEffect(() => {
    loadSkills();
    loadSessions();
  }, [loadSkills, loadSessions]);

  return (
    <main className="min-h-screen bg-ink-950 p-4 pb-24 text-white sm:p-6 lg:p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="font-serif-display text-sm italic tracking-wide text-kincha-400">âm dương giới</div>
          <h1 className="mt-1 font-serif-display text-xl font-semibold sm:text-2xl">Trà Đình</h1>
        </div>
        <Link
          href="/"
          className="rounded-sm border border-white/15 px-4 py-2 font-sans text-sm text-white/70 transition hover:border-kincha-400/50 hover:text-kincha-200"
        >
          ← Âm Dương Giới
        </Link>
      </header>

      <ScrollCard glow="kincha" className="mb-6">
        <h2 className="mb-3 font-sans text-[12px] font-medium tracking-wide text-kincha-400">Trình độ theo kỹ năng</h2>
        {!skills ? (
          <p className="font-sans text-[12px] text-white/40">Đang tải...</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {SKILLS.map((skillCode) => {
              const row = skills.find((s) => s.skill === skillCode);
              return (
                <div key={skillCode}>
                  <div className="mb-1 flex items-center justify-between font-sans text-[12px]">
                    <span className="text-white/80">{SKILL_LABEL[skillCode]}</span>
                    <span className="text-white/40">
                      {row?.cefrLevel ? `${row.cefrLevel} · ` : ""}
                      {row?.score ?? "—"}
                    </span>
                  </div>
                  <ProgressBar value={row?.score ?? 0} max={100} />
                </div>
              );
            })}
          </div>
        )}
      </ScrollCard>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-sans text-[12px] font-medium tracking-wide text-kincha-400">Các buổi luyện</h2>
        <button
          onClick={() => setNewSessionOpen(true)}
          className="rounded-sm bg-kincha-400 px-3 py-1.5 font-sans text-[12px] font-medium text-ink-950 hover:bg-kincha-400/80"
        >
          + Bắt đầu buổi luyện mới
        </button>
      </div>

      {sessions === null ? (
        <p className="font-sans text-[12px] text-white/40">Đang tải...</p>
      ) : sessions.length === 0 ? (
        <p className="font-sans text-[12px] text-white/40">Chưa có buổi luyện nào.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((s) => (
            <Link key={s.id} href={`/tra-dinh/${s.id}`}>
              <ScrollCard glow="yugen" className="p-3 transition-colors hover:border-white/25">
                <div className="flex items-center justify-between">
                  <p className="font-sans text-[13px] font-medium text-white">{s.name}</p>
                  <span className="shrink-0 rounded-sm border border-white/15 px-2 py-0.5 font-sans text-[10px] text-white/50">
                    {MODE_LABEL[s.practiceDetails?.mode ?? ""] ?? s.practiceDetails?.mode}
                  </span>
                </div>
                <p className="mt-1 font-sans text-[11px] text-white/40">
                  {new Date(s.createdAt).toLocaleDateString("vi-VN")}
                  {s.archivedAt ? " · Đã kết thúc" : " · Đang diễn ra"}
                </p>
                {s.practiceDetails?.summary && (
                  <p className="mt-2 line-clamp-2 font-sans text-[12px] text-white/60">{s.practiceDetails.summary}</p>
                )}
              </ScrollCard>
            </Link>
          ))}
        </div>
      )}

      <NewPracticeSessionModal
        open={newSessionOpen}
        onClose={() => setNewSessionOpen(false)}
        onCreated={(created) => router.push(`/tra-dinh/${created.id}`)}
      />
    </main>
  );
}
