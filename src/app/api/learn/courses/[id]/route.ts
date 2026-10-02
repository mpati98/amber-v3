import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
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

export const PATCH = withAuth(async (req, userId, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const body = await req.json();
  const parsed = updateCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, startDate, endDate, status, source, field, outcome } = parsed.data;

  const result = await db.transaction(async (tx) => {
    const project = await tx.query.projects.findFirst({
      where: and(eq(projects.id, id), eq(projects.userId, userId), eq(projects.type, "LEARN")),
    });
    if (!project) return null;

    const projectSet = {
      ...(name !== undefined ? { name } : {}),
      ...(startDate !== undefined ? { startDate } : {}),
      ...(endDate !== undefined ? { endDate } : {}),
      // Hoàn thành khóa học = archive project, đúng logic dùng chung archivedAt cho mọi loại
      ...(status !== undefined ? { archivedAt: status === "COMPLETED" ? new Date() : null } : {}),
    };
    const detailsSet = {
      ...(source !== undefined ? { source } : {}),
      ...(field !== undefined ? { field } : {}),
      ...(outcome !== undefined ? { outcome } : {}),
      ...(status !== undefined ? { status } : {}),
    };

    // Chỉ UPDATE bảng nào có field đổi: Drizzle ném "No values to set" khi set({})
    // rỗng — trước đây PATCH chỉ có outcome (ô "Kết quả đạt được") hoặc chỉ có
    // name luôn lỗi 500.
    const [updatedProject] = Object.keys(projectSet).length
      ? await tx.update(projects).set(projectSet).where(eq(projects.id, id)).returning()
      : [project];
    const [updatedDetails] = Object.keys(detailsSet).length
      ? await tx.update(learnCourseDetails).set(detailsSet).where(eq(learnCourseDetails.projectId, id)).returning()
      : await tx.select().from(learnCourseDetails).where(eq(learnCourseDetails.projectId, id));

    return { ...updatedProject, learnDetails: updatedDetails };
  });

  if (!result) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (status === "COMPLETED") {
    await logActivity({
      userId,
      source: "LEARN",
      action: "learn.course_completed",
      title: result.name,
    });
  }

  return NextResponse.json(result);
});

export const DELETE = withAuth(async (_req, userId, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId), eq(projects.type, "LEARN")));
  return NextResponse.json({ success: true });
});
