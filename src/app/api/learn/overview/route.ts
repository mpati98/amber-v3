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

  const courses = await db.query.projects.findMany({
    where: (p, { eq, and }) => and(eq(p.userId, userId), eq(p.type, "LEARN")),
    with: { learnDetails: true, learnLessons: true },
  });

  const inProgress = courses.find((c) => c.learnDetails?.status === "IN_PROGRESS") ?? null;
  const lastLesson = inProgress
    ? [...inProgress.learnLessons].sort((a, b) => (b.studiedAt ?? "").localeCompare(a.studiedAt ?? ""))[0] ?? null
    : null;

  const completedThisYear = courses.filter(
    (c) => c.learnDetails?.status === "COMPLETED" && c.archivedAt && new Date(c.archivedAt).getFullYear() === year
  ).length;

  const nextPlanned = courses
    .filter((c) => c.learnDetails?.status === "PLANNED")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0] ?? null;

  return NextResponse.json({
    year,
    totalCourses: courses.length,
    completedThisYear,
    currentCourse: inProgress
      ? { id: inProgress.id, name: inProgress.name, lastLessonTitle: lastLesson?.title ?? null, lastLessonDate: lastLesson?.studiedAt ?? null, lessonCount: inProgress.learnLessons.length }
      : null,
    nextPlannedCourse: nextPlanned ? { id: nextPlanned.id, name: nextPlanned.name } : null,
  });
}
