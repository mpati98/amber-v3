import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { financeCategories } from "@/db/schema";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  kind: z.enum(["INCOME", "EXPENSE"]),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const kind = req.nextUrl.searchParams.get("kind");

  const rows = await db.query.financeCategories.findMany({
    where: (c, { eq, and }) =>
      kind ? and(eq(c.userId, session.user.id), eq(c.kind, kind)) : eq(c.userId, session.user.id),
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db
    .insert(financeCategories)
    .values({ ...parsed.data, userId: session.user.id })
    .returning();
  return NextResponse.json(created, { status: 201 });
}
