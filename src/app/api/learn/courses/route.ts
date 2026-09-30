import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db";
import { projects, learnCourseDetails } from "@/db/schema";
import { z } from "zod";
import { logActivity } from "@/lib/activity-log";

const createCourseSchema = z.object({
  name: z.string().min(1),
  source: z.string().optional(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]).default("PLANNED"),
});

export const GET = withAuth(async (_req, userId) => {
  const rows = await db.query.projects.findMany({
    where: (p, { eq, and }) => and(eq(p.userId, userId), eq(p.type, "LEARN")),
    orderBy: (p, { desc }) => desc(p.createdAt),
    with: { learnDetails: true, learnLessons: true },
  });
  return NextResponse.json(rows);
});

export const POST = withAuth(async (req, userId) => {
  const body = await req.json();
  const parsed = createCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, source, field, startDate, endDate, status } = parsed.data;

  const result = await db.transaction(async (tx) => {
    const [project] = await tx
      .insert(projects)
      .values({
        userId,
        name,
        type: "LEARN",
        startDate: startDate || null,
        endDate: endDate || null,
        archivedAt: status === "COMPLETED" ? new Date() : null,
      })
      .returning();

    const [details] = await tx
      .insert(learnCourseDetails)
      .values({
        projectId: project.id,
        source: source || null,
        field: field || null,
        status,
      })
      .returning();

    return { ...project, learnDetails: details };
  });

  await logActivity({
    userId,
    source: "LEARN",
    action: "learn.course_created",
    title: result.name,
  });

  return NextResponse.json(result, { status: 201 });
});
