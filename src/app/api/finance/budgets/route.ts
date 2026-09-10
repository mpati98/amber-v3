import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { financeBudgets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const upsertBudgetSchema = z.object({
  projectId: z.string().uuid(),
  categoryId: z.string().uuid(),
  limitAmount: z.number().positive(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const rows = await db.query.financeBudgets.findMany({
    where: (b, { eq: eqOp, and: andOp }) => andOp(eqOp(b.userId, session.user.id), eqOp(b.projectId, projectId)),
    with: { category: true },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = upsertBudgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { projectId, categoryId, limitAmount } = parsed.data;

  const existing = await db.query.financeBudgets.findFirst({
    where: and(
      eq(financeBudgets.userId, session.user.id),
      eq(financeBudgets.projectId, projectId),
      eq(financeBudgets.categoryId, categoryId)
    ),
  });

  if (existing) {
    const [updated] = await db
      .update(financeBudgets)
      .set({ limitAmount: String(limitAmount) })
      .where(eq(financeBudgets.id, existing.id))
      .returning();
    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(financeBudgets)
    .values({ projectId, categoryId, limitAmount: String(limitAmount), userId: session.user.id })
    .returning();
  return NextResponse.json(created, { status: 201 });
}
