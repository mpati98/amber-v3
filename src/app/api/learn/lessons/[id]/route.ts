import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db";
import { learnLessons } from "@/db/schema";
import { logActivity } from "@/lib/activity-log";
import { findOwnedLesson } from "@/lib/learn-access";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateLessonSchema = z.object({
  title: z.string().min(1).optional(),
  studiedAt: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  note: z.string().optional(),
});

export const PATCH = withAuth(async (req, userId, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  // Bài học phải thuộc khóa học của chính user — trước đây sửa được bài học
  // của bất kỳ ai nếu biết id (không có điều kiện userId nào).
  if (!(await findOwnedLesson(id, userId))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateLessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db.update(learnLessons).set(parsed.data).where(eq(learnLessons.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });

  logActivity({
    userId,
    source: "LEARN",
    action: "lesson.updated",
    title: `Cập nhật bài học: ${updated.title}`,
    metadata: { lessonId: updated.id, studiedAt: updated.studiedAt },
  });

  return NextResponse.json(updated);
});

export const DELETE = withAuth(async (_req, userId, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  // Như PATCH: trước đây xóa được bài học của bất kỳ ai. Giờ không tồn tại
  // hoặc của người khác đều 404 (trước đây luôn trả success).
  const lesson = await findOwnedLesson(id, userId);
  if (!lesson) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await db.delete(learnLessons).where(eq(learnLessons.id, lesson.id));

  logActivity({
    userId,
    source: "LEARN",
    action: "lesson.deleted",
    title: `Xóa bài học: ${lesson.title}`,
    metadata: { lessonId: lesson.id },
  });

  return NextResponse.json({ success: true });
});
