import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db";
import { learnLessons } from "@/db/schema";
import { z } from "zod";
import { logActivity } from "@/lib/activity-log";
import { findOwnedCourse } from "@/lib/learn-access";

const createLessonSchema = z.object({
  title: z.string().min(1),
  studiedAt: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  note: z.string().optional(),
});

export const GET = withAuth(async (_req, userId, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  // Khóa học phải của chính user — trước đây đọc được bài học của khóa bất kỳ nếu biết id.
  if (!(await findOwnedCourse(id, userId))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const rows = await db.query.learnLessons.findMany({
    where: (l, { eq }) => eq(l.projectId, id),
    orderBy: (l, { desc }) => desc(l.studiedAt),
  });
  return NextResponse.json(rows);
});

export const POST = withAuth(async (req, userId, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  // Trước đây thêm được bài học vào khóa học của user khác nếu biết id.
  if (!(await findOwnedCourse(id, userId))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = createLessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db
    .insert(learnLessons)
    .values({ ...parsed.data, projectId: id })
    .returning();

  await logActivity({
    userId,
    source: "LEARN",
    action: "learn.lesson_logged",
    title: created.title,
  });

  return NextResponse.json(created, { status: 201 });
});
