import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { projects, tasks, financeTransactions, financeBudgets } from "@/db/schema";
import { eq, and, ne, isNotNull, isNull, lte, sql } from "drizzle-orm";
import { formatVND } from "@/lib/currency";

type Alert = {
  id: string;
  kind: "TASK_DUE" | "BUDGET_EXCEEDED" | "FINANCE_MONTH_MISSING" | "LEARN_INACTIVE";
  title: string;
  detail?: string;
  href: string;
};

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function daysSince(isoDate: string, now: Date): number {
  return (now.getTime() - new Date(isoDate).getTime()) / (24 * 60 * 60 * 1000);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const now = new Date();
  const alerts: Alert[] = [];

  // 1) Task sắp/đã trễ hạn (dueDate <= 3 ngày tới, chưa DONE)
  const in3Days = toIsoDate(addDays(now, 3));
  const dueTasks = await db.query.tasks.findMany({
    where: and(eq(tasks.userId, userId), ne(tasks.status, "DONE"), isNotNull(tasks.dueDate), lte(tasks.dueDate, in3Days)),
  });
  for (const t of dueTasks) {
    alerts.push({
      id: `task:${t.id}`,
      kind: "TASK_DUE",
      title: `Sắp/đã trễ hạn: "${t.title}"`,
      detail: t.dueDate ?? undefined,
      href: "/du-an",
    });
  }

  // 2) & 3) Project FINANCE tháng hiện tại — vượt ngân sách hoặc chưa bắt đầu tháng mới
  const start = monthStart(now);
  const currentFinance = await db.query.projects.findFirst({
    where: and(eq(projects.userId, userId), eq(projects.type, "FINANCE"), eq(projects.startDate, toIsoDate(start))),
  });

  if (!currentFinance) {
    if (now.getUTCDate() > 3) {
      alerts.push({
        id: "finance:missing-month",
        kind: "FINANCE_MONTH_MISSING",
        title: "Chưa bắt đầu dự án tài chính cho tháng này",
        href: "/finance",
      });
    }
  } else {
    const budgets = await db.query.financeBudgets.findMany({
      where: eq(financeBudgets.projectId, currentFinance.id),
      with: { category: true },
    });
    if (budgets.length > 0) {
      const spentRows = await db
        .select({
          categoryId: financeTransactions.categoryId,
          total: sql<string>`coalesce(sum(${financeTransactions.amount}), 0)`,
        })
        .from(financeTransactions)
        .where(and(eq(financeTransactions.projectId, currentFinance.id), eq(financeTransactions.kind, "EXPENSE")))
        .groupBy(financeTransactions.categoryId);
      const spentByCategory = new Map(spentRows.map((r) => [r.categoryId, Number(r.total)]));

      for (const b of budgets) {
        const spent = spentByCategory.get(b.categoryId) ?? 0;
        const limit = Number(b.limitAmount);
        if (spent > limit) {
          alerts.push({
            id: `budget:${b.id}`,
            kind: "BUDGET_EXCEEDED",
            title: `Vượt ngân sách "${b.category?.name ?? "?"}"`,
            detail: `${formatVND(spent)} / ${formatVND(limit)}`,
            href: `/finance/${currentFinance.id}`,
          });
        }
      }
    }
  }

  // 4) Khóa học LEARN đang học nhưng lâu chưa luyện (bài học gần nhất > 3 ngày)
  const learnCourses = await db.query.projects.findMany({
    where: and(eq(projects.userId, userId), eq(projects.type, "LEARN"), isNull(projects.archivedAt)),
    with: { learnDetails: true, learnLessons: true },
  });
  for (const c of learnCourses) {
    if (c.learnDetails?.status !== "IN_PROGRESS") continue;
    const latestStudiedAt = c.learnLessons.reduce<string | null>((latest, l) => {
      if (!l.studiedAt) return latest;
      return !latest || l.studiedAt > latest ? l.studiedAt : latest;
    }, null);
    const idleDays = latestStudiedAt ? daysSince(latestStudiedAt, now) : Infinity;
    if (idleDays > 3) {
      alerts.push({
        id: `learn:${c.id}`,
        kind: "LEARN_INACTIVE",
        title: `Lâu rồi chưa học "${c.name}"`,
        href: `/hoc-tap/${c.id}`,
      });
    }
  }

  const recentActivity = await db.query.activityLogs.findMany({
    where: (a, { eq: eqOp }) => eqOp(a.userId, userId),
    orderBy: (a, { desc }) => desc(a.createdAt),
    limit: 20,
  });

  return NextResponse.json({ alerts, recentActivity });
}
