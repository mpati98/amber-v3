import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { z } from "zod";
import { logActivity } from "@/lib/activity-log";
import { userOwnsProject } from "@/lib/project-access";

const createTaskSchema = z.object({
  projectId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["PREP", "WAITING", "IN_PROGRESS", "DONE"]).default("PREP"),
  importance: z.number().int().min(1).max(3),
  urgency: z.number().int().min(1).max(3),
  durationMinutes: z.number().int().min(5).default(15),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  prepLeadDays: z.number().int().optional(),
});

export const GET = withAuth(async (req, userId) => {
  const kind = req.nextUrl.searchParams.get("kind"); // "gantt" = chỉ task có startDate/dueDate, không lặp

  const rows = await db.query.tasks.findMany({
    where: (t, { eq, and, isNull, isNotNull }) =>
      kind === "gantt"
        ? and(eq(t.userId, userId), isNull(t.rrule), isNotNull(t.startDate), isNotNull(t.dueDate))
        : eq(t.userId, userId),
    with: { occurrences: true },
  });
  return NextResponse.json(rows);
});

export const POST = withAuth(async (req, userId) => {
  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  // Trước đây gắn được task vào project của người khác (task đó bị tính vào
  // tiến độ dự án của họ trong du-an/overview).
  if (parsed.data.projectId && !(await userOwnsProject(parsed.data.projectId, userId))) {
    return NextResponse.json({ error: "project_not_found" }, { status: 404 });
  }
  const [created] = await db
    .insert(tasks)
    .values({ ...parsed.data, userId })
    .returning();

  await logActivity({
    userId,
    source: "DU_AN",
    action: "task.created",
    title: created.title,
  });

  return NextResponse.json(created, { status: 201 });
});
