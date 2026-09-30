import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db";
import { financeBudgets, financeCategories, projects } from "@/db/schema";
import { logActivity } from "@/lib/activity-log";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const upsertBudgetSchema = z.object({
  projectId: z.string().uuid(),
  categoryId: z.string().uuid(),
  limitAmount: z.number().positive(),
});

export const GET = withAuth(async (req, userId) => {
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const rows = await db.query.financeBudgets.findMany({
    where: (b, { eq: eqOp, and: andOp }) => andOp(eqOp(b.userId, userId), eqOp(b.projectId, projectId)),
    with: { category: true },
  });
  return NextResponse.json(rows);
});

export const POST = withAuth(async (req, userId) => {
  const body = await req.json();
  const parsed = upsertBudgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { projectId, categoryId, limitAmount } = parsed.data;

  // Cùng pattern với POST /finance/transactions: tháng tài chính phải là
  // project FINANCE của chính user và còn mở; danh mục phải của user. Trước
  // đây không kiểm tra — tạo được ngân sách trỏ vào project/danh mục bất kỳ.
  // Không tồn tại / của người khác / sai loại → cùng 1 mã 404.
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId), eq(projects.type, "FINANCE")),
  });
  if (!project) {
    return NextResponse.json({ error: "project_not_found" }, { status: 404 });
  }
  if (project.archivedAt) {
    return NextResponse.json({ error: "project_archived" }, { status: 400 });
  }
  const category = await db.query.financeCategories.findFirst({
    where: and(eq(financeCategories.id, categoryId), eq(financeCategories.userId, userId)),
  });
  if (!category) {
    return NextResponse.json({ error: "category_not_found" }, { status: 404 });
  }

  const existing = await db.query.financeBudgets.findFirst({
    where: and(
      eq(financeBudgets.userId, userId),
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

    logActivity({
      userId,
      source: "FINANCE",
      action: "budget.updated",
      title: `Cập nhật ngân sách: ${limitAmount}`,
      metadata: { budgetId: updated.id, limitAmount: updated.limitAmount },
    });

    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(financeBudgets)
    .values({ projectId, categoryId, limitAmount: String(limitAmount), userId })
    .returning();

  logActivity({
    userId,
    source: "FINANCE",
    action: "budget.created",
    title: `Tạo ngân sách: ${limitAmount}`,
    metadata: { budgetId: created.id, limitAmount: created.limitAmount },
  });

  return NextResponse.json(created, { status: 201 });
});
