import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db";
import { financeAccounts, financeCategories, financeTransactions, projects } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { logActivity } from "@/lib/activity-log";

const createTransactionSchema = z.object({
  projectId: z.string().uuid(),
  accountId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  kind: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive(),
  note: z.string().optional(),
  occurredAt: z.string().optional(),
});

export const GET = withAuth(async (req, userId) => {
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const rows = await db.query.financeTransactions.findMany({
    where: (t, { eq: eqOp, and: andOp }) => andOp(eqOp(t.userId, userId), eqOp(t.projectId, projectId)),
    with: { category: true, account: true },
    orderBy: (t, { desc }) => desc(t.occurredAt),
  });
  return NextResponse.json(rows);
});

export const POST = withAuth(async (req, userId) => {
  const body = await req.json();
  const parsed = createTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { accountId, projectId, kind, amount, occurredAt, ...rest } = parsed.data;

  // Tháng tài chính phải là project FINANCE của chính user và còn mở. Trước đây
  // không kiểm tra gì: ghi được giao dịch vào project bất kỳ (của người khác,
  // project thường, học tập) hoặc vào tháng đã kết thúc.
  // Không tồn tại / của người khác / không phải FINANCE → cùng 1 mã 404.
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId), eq(projects.type, "FINANCE")),
  });
  if (!project) {
    return NextResponse.json({ error: "project_not_found" }, { status: 404 });
  }
  if (project.archivedAt) {
    return NextResponse.json({ error: "project_archived" }, { status: 400 });
  }

  // Trước đây throw → 500; giờ trả 404 rõ ràng.
  const account = await db.query.financeAccounts.findFirst({
    where: and(eq(financeAccounts.id, accountId), eq(financeAccounts.userId, userId)),
  });
  if (!account) {
    return NextResponse.json({ error: "account_not_found" }, { status: 404 });
  }

  // Danh mục (nếu có) cũng phải của user — trước đây gắn được danh mục của
  // người khác, và GET giao dịch sẽ join ra tên/icon danh mục đó.
  if (rest.categoryId) {
    const category = await db.query.financeCategories.findFirst({
      where: and(eq(financeCategories.id, rest.categoryId), eq(financeCategories.userId, userId)),
    });
    if (!category) {
      return NextResponse.json({ error: "category_not_found" }, { status: 404 });
    }
  }

  const result = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(financeTransactions)
      .values({
        ...rest,
        accountId,
        projectId,
        kind,
        amount: String(amount),
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        userId,
      })
      .returning();

    const delta = kind === "INCOME" ? amount : -amount;
    await tx
      .update(financeAccounts)
      .set({ currentBalance: sql`${financeAccounts.currentBalance} + ${delta}` })
      .where(eq(financeAccounts.id, accountId));

    return created;
  });

  await logActivity({
    userId,
    source: "FINANCE",
    action: "finance.transaction_created",
    title: result.note || (result.kind === "INCOME" ? "Thu nhập" : "Chi tiêu"),
    metadata: { amount: result.amount, kind: result.kind },
  });

  return NextResponse.json(result, { status: 201 });
});
