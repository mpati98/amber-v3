import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db";
import { financeCategories } from "@/db/schema";
import { logActivity } from "@/lib/activity-log";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  kind: z.enum(["INCOME", "EXPENSE"]),
});

export const GET = withAuth(async (req, userId) => {
  const kind = req.nextUrl.searchParams.get("kind");

  const rows = await db.query.financeCategories.findMany({
    where: (c, { eq, and }) =>
      kind ? and(eq(c.userId, userId), eq(c.kind, kind)) : eq(c.userId, userId),
  });
  return NextResponse.json(rows);
});

export const POST = withAuth(async (req, userId) => {
  const body = await req.json();
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db
    .insert(financeCategories)
    .values({ ...parsed.data, userId })
    .returning();

  logActivity({
    userId,
    source: "FINANCE",
    action: "category.created",
    title: `Tạo danh mục: ${created.name}`,
    metadata: { categoryId: created.id, kind: created.kind },
  });

  return NextResponse.json(created, { status: 201 });
});
