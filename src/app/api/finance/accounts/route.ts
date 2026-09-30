import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db";
import { financeAccounts } from "@/db/schema";
import { logActivity } from "@/lib/activity-log";
import { z } from "zod";

const createAccountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["CASH", "BANK", "E_WALLET", "CREDIT_CARD"]),
  currentBalance: z.number().default(0),
});

export const GET = withAuth(async (_req, userId) => {
  const rows = await db.query.financeAccounts.findMany({
    where: (a, { eq, isNull, and }) => and(eq(a.userId, userId), isNull(a.archivedAt)),
  });
  return NextResponse.json(rows);
});

export const POST = withAuth(async (req, userId) => {
  const body = await req.json();
  const parsed = createAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db
    .insert(financeAccounts)
    .values({
      ...parsed.data,
      currentBalance: String(parsed.data.currentBalance),
      userId,
    })
    .returning();

  logActivity({
    userId,
    source: "FINANCE",
    action: "account.created",
    title: `Tạo tài khoản: ${created.name}`,
    metadata: { accountId: created.id, type: created.type },
  });

  return NextResponse.json(created, { status: 201 });
});
