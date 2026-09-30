import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { vnYear } from "@/lib/vn-time";
import { db } from "@/db";

export const GET = withAuth(async (req, userId) => {
  const year = Number(req.nextUrl.searchParams.get("year") ?? vnYear());

  const courses = await db.query.projects.findMany({
    where: (p, { eq, and }) => and(eq(p.userId, userId), eq(p.type, "LEARN")),
    with: { learnDetails: true, learnLessons: true },
  });

  const inProgress = courses.find((c) => c.learnDetails?.status === "IN_PROGRESS") ?? null;
  const lastLesson = inProgress
    ? [...inProgress.learnLessons].sort((a, b) => (b.studiedAt ?? "").localeCompare(a.studiedAt ?? ""))[0] ?? null
    : null;

  const completedThisYear = courses.filter(
    (c) => c.learnDetails?.status === "COMPLETED" && c.archivedAt && vnYear(new Date(c.archivedAt)) === year
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
});
