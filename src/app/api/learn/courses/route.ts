import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { projects, learnCourseDetails } from "@/db/schema";
import { z } from "zod";

const createCourseSchema = z.object({
  name: z.string().min(1),
  source: z.string().optional(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]).default("PLANNED"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db.query.projects.findMany({
    where: (p, { eq, and }) => and(eq(p.userId, session.user.id), eq(p.type, "LEARN")),
    orderBy: (p, { desc }) => desc(p.createdAt),
    with: { learnDetails: true, learnLessons: true },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

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
        userId: session.user.id,
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

  return NextResponse.json(result, { status: 201 });
}
