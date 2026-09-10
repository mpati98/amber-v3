import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const year = Number(req.nextUrl.searchParams.get("year") ?? new Date().getFullYear());
  const today = new Date().toISOString().slice(0, 10);

  const allProjects = await db.query.projects.findMany({
    where: (p, { eq, and }) => and(eq(p.userId, userId), eq(p.type, "STANDARD")),
    with: { tasks: true },
  });

  const active = allProjects.filter((p) => !p.archivedAt);
  const activeWithProgress = active.map((p) => {
    const total = p.tasks.length;
    const done = p.tasks.filter((t) => t.status === "DONE").length;
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      totalTasks: total,
      doneTasks: done,
      progressPct: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

  const completedThisYear = allProjects.filter(
    (p) => p.archivedAt && new Date(p.archivedAt).getFullYear() === year
  ).length;

  const upcoming = active
    .filter((p) => p.startDate && p.startDate > today)
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))[0] ?? null;

  return NextResponse.json({
    year,
    activeProjects: activeWithProgress,
    completedThisYear,
    upcomingProject: upcoming ? { id: upcoming.id, name: upcoming.name, startDate: upcoming.startDate } : null,
  });
}
