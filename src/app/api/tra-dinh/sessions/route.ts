import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { projects, practiceSessionDetails } from "@/db/schema";
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

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db.query.projects.findMany({
    where: (p, { eq, and }) => and(eq(p.userId, session.user.id), eq(p.type, "PRACTICE")),
    orderBy: (p, { desc }) => desc(p.createdAt),
    with: { practiceDetails: true },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

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
        userId: session.user.id,
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

  return NextResponse.json(result, { status: 201 });
}
