import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
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

export const GET = withAuth(async (req, userId) => {
  const type = req.nextUrl.searchParams.get("type");

  const rows = await db.query.projects.findMany({
    where: (p, { eq, isNull, and }) =>
      type
        ? and(eq(p.userId, userId), isNull(p.archivedAt), eq(p.type, type))
        : and(eq(p.userId, userId), isNull(p.archivedAt)),
  });
  return NextResponse.json(rows);
});

export const POST = withAuth(async (req, userId) => {
  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [created] = await db
    .insert(projects)
    .values({ ...parsed.data, userId })
    .returning();
  return NextResponse.json(created, { status: 201 });
});
