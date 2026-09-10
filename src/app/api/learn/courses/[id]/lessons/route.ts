import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { learnLessons } from "@/db/schema";
import { z } from "zod";

const createLessonSchema = z.object({
  title: z.string().min(1),
  studiedAt: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  note: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const rows = await db.query.learnLessons.findMany({
    where: (l, { eq }) => eq(l.projectId, id),
    orderBy: (l, { desc }) => desc(l.studiedAt),
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const body = await req.json();
  const parsed = createLessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db
    .insert(learnLessons)
    .values({ ...parsed.data, projectId: id })
    .returning();
  return NextResponse.json(created, { status: 201 });
}
