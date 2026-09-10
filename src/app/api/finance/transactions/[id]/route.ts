import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { financeAccounts, financeTransactions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  await db.transaction(async (tx) => {
    const existing = await tx.query.financeTransactions.findFirst({
      where: and(eq(financeTransactions.id, id), eq(financeTransactions.userId, session.user.id)),
    });
    if (!existing) throw new Error("not_found");

    const amount = Number(existing.amount);
    const delta = existing.kind === "INCOME" ? -amount : amount; // đảo ngược tác động cũ

    await tx
      .update(financeAccounts)
      .set({ currentBalance: sql`${financeAccounts.currentBalance} + ${delta}` })
      .where(eq(financeAccounts.id, existing.accountId));

    await tx.delete(financeTransactions).where(eq(financeTransactions.id, id));
  });

  return NextResponse.json({ success: true });
}
