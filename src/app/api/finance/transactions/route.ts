import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { financeAccounts, financeTransactions } from "@/db/schema";
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

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const rows = await db.query.financeTransactions.findMany({
    where: (t, { eq: eqOp, and: andOp }) => andOp(eqOp(t.userId, session.user.id), eqOp(t.projectId, projectId)),
    with: { category: true, account: true },
    orderBy: (t, { desc }) => desc(t.occurredAt),
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { accountId, projectId, kind, amount, occurredAt, ...rest } = parsed.data;

  const result = await db.transaction(async (tx) => {
    const account = await tx.query.financeAccounts.findFirst({
      where: and(eq(financeAccounts.id, accountId), eq(financeAccounts.userId, session.user.id)),
    });
    if (!account) throw new Error("account_not_found");

    const [created] = await tx
      .insert(financeTransactions)
      .values({
        ...rest,
        accountId,
        projectId,
        kind,
        amount: String(amount),
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        userId: session.user.id,
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
    userId: session.user.id,
    source: "FINANCE",
    action: "finance.transaction_created",
    title: result.note || (result.kind === "INCOME" ? "Thu nhập" : "Chi tiêu"),
    metadata: { amount: result.amount, kind: result.kind },
  });

  return NextResponse.json(result, { status: 201 });
}
