import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const year = Number(req.nextUrl.searchParams.get("year") ?? new Date().getFullYear());

  const financeProjects = await db.query.projects.findMany({
    where: (p, { eq, and, gte, lt }) =>
      and(
        eq(p.userId, userId),
        eq(p.type, "FINANCE"),
        gte(p.startDate, `${year}-01-01`),
        lt(p.startDate, `${year + 1}-01-01`)
      ),
    orderBy: (p, { asc }) => asc(p.startDate),
  });

  const projectIds = financeProjects.map((p) => p.id);

  const [snapshots, accounts, yearTransactions] = await Promise.all([
    db.query.financeBalanceSnapshots.findMany({
      where: (s, { inArray }) => (projectIds.length ? inArray(s.projectId, projectIds) : undefined),
    }),
    db.query.financeAccounts.findMany({
      where: (a, { eq: eqOp, isNull, and: andOp }) => andOp(eqOp(a.userId, userId), isNull(a.archivedAt)),
    }),
    db.query.financeTransactions.findMany({
      where: (t, { eq: eqOp, inArray }) => (projectIds.length ? inArray(t.projectId, projectIds) : eqOp(t.userId, userId)),
      with: { category: true },
    }),
  ]);

  const snapshotByProject = new Map(snapshots.map((s) => [s.projectId, Number(s.totalBalance)]));
  const currentBalance = accounts.reduce((sum, a) => sum + Number(a.currentBalance), 0);

  // Chuỗi biến động: mỗi tháng = số dư lúc BẮT ĐẦU tháng đó (từ snapshot); điểm cuối cùng là số dư hiện tại (sống)
  const balanceTrend = financeProjects.map((p) => ({
    month: p.startDate?.slice(0, 7) ?? "",
    projectId: p.id,
    balance: snapshotByProject.get(p.id) ?? null,
  }));
  balanceTrend.push({ month: "now", projectId: "current", balance: currentBalance });

  const totalIncome = yearTransactions.filter((t) => t.kind === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = yearTransactions.filter((t) => t.kind === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);

  const byCategory = new Map<string, { name: string; icon: string | null; total: number }>();
  for (const t of yearTransactions) {
    if (t.kind !== "EXPENSE") continue;
    const key = t.categoryId ?? "uncategorized";
    const name = t.category?.name ?? "Chưa phân loại";
    const icon = t.category?.icon ?? null;
    const cur = byCategory.get(key) ?? { name, icon, total: 0 };
    cur.total += Number(t.amount);
    byCategory.set(key, cur);
  }
  const categoryBreakdown = Array.from(byCategory.values()).sort((a, b) => b.total - a.total);

  const activeProject = financeProjects.find((p) => !p.archivedAt) ?? null;

  return NextResponse.json({
    year,
    currentBalance,
    totalIncome,
    totalExpense,
    monthsTracked: financeProjects.length,
    balanceTrend,
    categoryBreakdown,
    activeProjectId: activeProject?.id ?? null,
    activeProjectName: activeProject?.name ?? null,
  });
}
