import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { financeAccounts } from "@/db/schema";
import { z } from "zod";

const createAccountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["CASH", "BANK", "E_WALLET", "CREDIT_CARD"]),
  currentBalance: z.number().default(0),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rows = await db.query.financeAccounts.findMany({
    where: (a, { eq, isNull, and }) => and(eq(a.userId, session.user.id), isNull(a.archivedAt)),
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

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
      userId: session.user.id,
    })
    .returning();
  return NextResponse.json(created, { status: 201 });
}
