import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { projects, learnCourseDetails } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { logActivity } from "@/lib/activity-log";

const updateCourseSchema = z.object({
  name: z.string().min(1).optional(),
  source: z.string().optional(),
  field: z.string().optional(),
  outcome: z.string().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const body = await req.json();
  const parsed = updateCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, startDate, endDate, status, source, field, outcome } = parsed.data;

  const result = await db.transaction(async (tx) => {
    const project = await tx.query.projects.findFirst({
      where: and(eq(projects.id, id), eq(projects.userId, session.user.id), eq(projects.type, "LEARN")),
    });
    if (!project) return null;

    const [updatedProject] = await tx
      .update(projects)
      .set({
        ...(name !== undefined ? { name } : {}),
        ...(startDate !== undefined ? { startDate } : {}),
        ...(endDate !== undefined ? { endDate } : {}),
        // Hoàn thành khóa học = archive project, đúng logic dùng chung archivedAt cho mọi loại
        ...(status !== undefined ? { archivedAt: status === "COMPLETED" ? new Date() : null } : {}),
      })
      .where(eq(projects.id, id))
      .returning();

    const [updatedDetails] = await tx
      .update(learnCourseDetails)
      .set({
        ...(source !== undefined ? { source } : {}),
        ...(field !== undefined ? { field } : {}),
        ...(outcome !== undefined ? { outcome } : {}),
        ...(status !== undefined ? { status } : {}),
      })
      .where(eq(learnCourseDetails.projectId, id))
      .returning();

    return { ...updatedProject, learnDetails: updatedDetails };
  });

  if (!result) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (status === "COMPLETED") {
    await logActivity({
      userId: session.user.id,
      source: "LEARN",
      action: "learn.course_completed",
      title: result.name,
    });
  }

  return NextResponse.json(result);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, session.user.id), eq(projects.type, "LEARN")));
  return NextResponse.json({ success: true });
}
