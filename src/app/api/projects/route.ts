import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  // Không giới hạn cứng vào 1 danh sách — cho phép thêm loại project đặc biệt mới (FINANCE, LEARN,...)
  // sau này mà không cần sửa lại API.
  type: z.string().min(1).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const type = req.nextUrl.searchParams.get("type");

  const rows = await db.query.projects.findMany({
    where: (p, { eq, isNull, and }) =>
      type
        ? and(eq(p.userId, session.user.id), isNull(p.archivedAt), eq(p.type, type))
        : and(eq(p.userId, session.user.id), isNull(p.archivedAt)),
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [created] = await db
    .insert(projects)
    .values({ ...parsed.data, userId: session.user.id })
    .returning();
  return NextResponse.json(created, { status: 201 });
}
