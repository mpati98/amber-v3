import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const [project, accounts, transactions, budgets] = await Promise.all([
    db.query.projects.findFirst({ where: (p, { eq: eqOp, and: andOp }) => andOp(eqOp(p.id, projectId), eqOp(p.userId, userId)) }),
    db.query.financeAccounts.findMany({
      where: (a, { eq: eqOp, isNull, and: andOp }) => andOp(eqOp(a.userId, userId), isNull(a.archivedAt)),
    }),
    db.query.financeTransactions.findMany({
      where: (t, { eq: eqOp, and: andOp }) => andOp(eqOp(t.userId, userId), eqOp(t.projectId, projectId)),
      with: { category: true },
    }),
    db.query.financeBudgets.findMany({
      where: (b, { eq: eqOp, and: andOp }) => andOp(eqOp(b.userId, userId), eqOp(b.projectId, projectId)),
      with: { category: true },
    }),
  ]);

  if (!project) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.currentBalance), 0);
  const totalIncome = transactions
    .filter((t) => t.kind === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.kind === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const spentByCategory = new Map<string, number>();
  for (const t of transactions) {
    if (t.kind !== "EXPENSE" || !t.categoryId) continue;
    spentByCategory.set(t.categoryId, (spentByCategory.get(t.categoryId) ?? 0) + Number(t.amount));
  }

  const budgetProgress = budgets.map((b) => ({
    categoryId: b.categoryId,
    categoryName: b.category?.name ?? "",
    icon: b.category?.icon ?? null,
    limitAmount: Number(b.limitAmount),
    spent: spentByCategory.get(b.categoryId) ?? 0,
  }));

  return NextResponse.json({
    project: { id: project.id, name: project.name, startDate: project.startDate, endDate: project.endDate, archivedAt: project.archivedAt },
    totalBalance,
    totalIncome,
    totalExpense,
    netThisMonth: totalIncome - totalExpense,
    budgetProgress,
  });
}
