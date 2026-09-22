"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ProjectsDashboard } from "@/components/calendar/ProjectsDashboard";

export default function StandardProjectsPage() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen bg-ink-950 p-4 text-white sm:p-6 lg:p-8">
      <div className="mb-4 flex items-center justify-between font-sans text-[11px] text-white/40">
        <Link href="/nghi-su-duong" className="text-kincha-400 hover:text-kincha-200">
          ← Nghị Sự Đường
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-serif-display text-xl font-semibold tracking-wide text-white">
          Tổng quan
        </h1>
      </div>

      <ProjectsDashboard userName={session?.user?.name} />
    </main>
  );
}
