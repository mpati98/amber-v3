import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db";
import { financeAccounts, financeTransactions } from "@/db/schema";
import { logActivity } from "@/lib/activity-log";
import { eq, and, sql } from "drizzle-orm";

export const DELETE = withAuth(async (_req, userId, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const found = await db.transaction(async (tx) => {
    const existing = await tx.query.financeTransactions.findFirst({
      where: and(eq(financeTransactions.id, id), eq(financeTransactions.userId, userId)),
    });
    if (!existing) return false;

    const amount = Number(existing.amount);
    const delta = existing.kind === "INCOME" ? -amount : amount; // đảo ngược tác động cũ

    await tx
      .update(financeAccounts)
      .set({ currentBalance: sql`${financeAccounts.currentBalance} + ${delta}` })
      .where(eq(financeAccounts.id, existing.accountId));

    await tx.delete(financeTransactions).where(eq(financeTransactions.id, id));
    return true;
  });
  // Trước đây throw → 500 khi không tìm thấy.
  if (!found) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  logActivity({
    userId,
    source: "FINANCE",
    action: "transaction.deleted",
    title: `Xóa giao dịch: ${id}`,
    metadata: { transactionId: id },
  });

  return NextResponse.json({ success: true });
});
