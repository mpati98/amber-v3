import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db";
import { projects, practiceSessionDetails } from "@/db/schema";
import { logActivity } from "@/lib/activity-log";
import { z } from "zod";

const createSessionSchema = z.object({
  mode: z.enum(["CONVERSATION", "EXAM_PREP", "PROFESSIONAL"]),
  name: z.string().min(1).optional(),
});

const MODE_NAME: Record<string, string> = {
  CONVERSATION: "Trò chuyện tự do",
  EXAM_PREP: "Luyện thi",
  PROFESSIONAL: "Tiếng Anh chuyên nghiệp",
};

export const GET = withAuth(async (_req, userId) => {
  const rows = await db.query.projects.findMany({
    where: (p, { eq, and }) => and(eq(p.userId, userId), eq(p.type, "PRACTICE")),
    orderBy: (p, { desc }) => desc(p.createdAt),
    with: { practiceDetails: true },
  });
  return NextResponse.json(rows);
});

export const POST = withAuth(async (req, userId) => {
  const body = await req.json();
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { mode, name } = parsed.data;
  const now = new Date();

  const result = await db.transaction(async (tx) => {
    const [project] = await tx
      .insert(projects)
      .values({
        userId,
        name: name || `${MODE_NAME[mode]} — ${now.toLocaleDateString("vi-VN")}`,
        type: "PRACTICE",
        startDate: now.toISOString().slice(0, 10),
      })
      .returning();

    const [details] = await tx
      .insert(practiceSessionDetails)
      .values({ projectId: project.id, mode })
      .returning();

    return { ...project, practiceDetails: details };
  });

  logActivity({
    userId,
    source: "TRA_DINH",
    action: "session.created",
    title: `Bắt đầu buổi: ${result.name}`,
    metadata: { sessionId: result.id, mode: result.practiceDetails?.mode },
  });

  return NextResponse.json(result, { status: 201 });
});
