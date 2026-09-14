import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { learnLessons } from "@/db/schema";
import { logActivity } from "@/lib/activity-log";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateLessonSchema = z.object({
  title: z.string().min(1).optional(),
  studiedAt: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  note: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const body = await req.json();
  const parsed = updateLessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db.update(learnLessons).set(parsed.data).where(eq(learnLessons.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });

  logActivity({
    userId: session.user.id,
    source: "LEARN",
    action: "lesson.updated",
    title: `Cập nhật bài học: ${updated.title}`,
    metadata: { lessonId: updated.id, studiedAt: updated.studiedAt },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const deleted = await db.query.learnLessons.findFirst({ where: eq(learnLessons.id, id) });
  await db.delete(learnLessons).where(eq(learnLessons.id, id));

  if (deleted) {
    logActivity({
      userId: session.user.id,
      source: "LEARN",
      action: "lesson.deleted",
      title: `Xóa bài học: ${deleted.title}`,
      metadata: { lessonId: deleted.id },
    });
  }

  return NextResponse.json({ success: true });
}
