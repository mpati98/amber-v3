import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { vnMonthBounds } from "@/lib/vn-time";
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

export const GET = withAuth(async (_req, userId) => {
  const rows = await db.query.projects.findMany({
    where: (p, { eq: eqOp, and: andOp }) => andOp(eqOp(p.userId, userId), eqOp(p.type, "FINANCE")),
    orderBy: (p, { desc }) => desc(p.startDate),
  });
  return NextResponse.json(rows);
});

// Idempotent: gọi bao nhiêu lần trong cùng 1 tháng cũng chỉ trả về đúng 1 project.
// Đồng thời tự archive project tháng cũ đã qua endDate — "kết thúc mỗi tháng" đúng nghĩa đen.
export const POST = withAuth(async (_req, userId) => {
  const now = new Date();
  // Tháng theo giờ VN: theo UTC, 0h–7h sáng ngày 1 vẫn tính là tháng trước →
  // không tạo được tháng mới và chưa lưu trữ tháng cũ.
  const { year, month, start, end } = vnMonthBounds(now);

  const result = await db.transaction(async (tx) => {
    // Archive mọi project FINANCE đã qua endDate mà chưa archive
    await tx
      .update(projects)
      .set({ archivedAt: now })
      .where(and(eq(projects.userId, userId), eq(projects.type, "FINANCE"), isNull(projects.archivedAt), lt(projects.endDate, start)));

    const existing = await tx.query.projects.findFirst({
      where: and(eq(projects.userId, userId), eq(projects.type, "FINANCE"), eq(projects.startDate, start)),
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
        name: `Tài chính — Tháng ${month}/${year}`,
        type: "FINANCE",
        startDate: start,
        endDate: end,
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
});
