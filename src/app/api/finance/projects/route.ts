import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { projects, financeAccounts, financeBalanceSnapshots, financeCategories } from "@/db/schema";
import { eq, and, lt, isNull } from "drizzle-orm";
import { logActivity } from "@/lib/activity-log";

const DEFAULT_CATEGORIES: { name: string; icon: string; kind: "INCOME" | "EXPENSE" }[] = [
  { name: "Ăn uống", icon: "🍜", kind: "EXPENSE" },
  { name: "Tiền trọ", icon: "🏠", kind: "EXPENSE" },
  { name: "Xăng / đi lại", icon: "🛵", kind: "EXPENSE" },
  { name: "Mua sắm", icon: "🛍️", kind: "EXPENSE" },
  { name: "Khác", icon: "🗂", kind: "EXPENSE" },
  { name: "Lương", icon: "💰", kind: "INCOME" },
  { name: "Thu nhập khác", icon: "💵", kind: "INCOME" },
];

function monthBounds(date: Date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 0)); // ngày cuối tháng
  return { start, end };
}

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

const MONTH_NAMES = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db.query.projects.findMany({
    where: (p, { eq: eqOp, and: andOp }) => andOp(eqOp(p.userId, session.user.id), eqOp(p.type, "FINANCE")),
    orderBy: (p, { desc }) => desc(p.startDate),
  });
  return NextResponse.json(rows);
}

// Idempotent: gọi bao nhiêu lần trong cùng 1 tháng cũng chỉ trả về đúng 1 project.
// Đồng thời tự archive project tháng cũ đã qua endDate — "kết thúc mỗi tháng" đúng nghĩa đen.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const now = new Date();
  const { start, end } = monthBounds(now);

  const result = await db.transaction(async (tx) => {
    // Archive mọi project FINANCE đã qua endDate mà chưa archive
    await tx
      .update(projects)
      .set({ archivedAt: now })
      .where(and(eq(projects.userId, userId), eq(projects.type, "FINANCE"), isNull(projects.archivedAt), lt(projects.endDate, toIsoDate(start))));

    const existing = await tx.query.projects.findFirst({
      where: and(eq(projects.userId, userId), eq(projects.type, "FINANCE"), eq(projects.startDate, toIsoDate(start))),
    });
    if (existing) return { project: existing, isNew: false };

    // Lần đầu dùng Finance — seed sẵn danh mục mặc định để không phải tự tạo tay
    const categoryCount = await tx.query.financeCategories.findMany({ where: eq(financeCategories.userId, userId) });
    if (categoryCount.length === 0) {
      await tx.insert(financeCategories).values(DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })));
    }

    const [created] = await tx
      .insert(projects)
      .values({
        userId,
        name: `Tài chính — Tháng ${MONTH_NAMES[now.getUTCMonth()]}/${now.getUTCFullYear()}`,
        type: "FINANCE",
        startDate: toIsoDate(start),
        endDate: toIsoDate(end),
      })
      .returning();

    // Chụp số dư mọi ví tại thời điểm bắt đầu tháng — làm điểm dữ liệu cho biểu đồ biến động
    const accounts = await tx.query.financeAccounts.findMany({
      where: and(eq(financeAccounts.userId, userId), isNull(financeAccounts.archivedAt)),
    });
    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.currentBalance), 0);
    await tx.insert(financeBalanceSnapshots).values({ projectId: created.id, totalBalance: String(totalBalance) });

    return { project: created, isNew: true };
  });

  if (result.isNew) {
    await logActivity({
      userId,
      source: "FINANCE",
      action: "finance.month_started",
      title: result.project.name,
    });
  }

  return NextResponse.json(result.project, { status: 201 });
}
