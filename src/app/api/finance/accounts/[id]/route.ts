import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db";
import { financeAccounts } from "@/db/schema";
import { logActivity } from "@/lib/activity-log";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  archived: z.boolean().optional(),
});

export const PATCH = withAuth(async (req, userId, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const body = await req.json();
  const parsed = updateAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { archived, ...rest } = parsed.data;
  const [updated] = await db
    .update(financeAccounts)
    .set({
      ...rest,
      ...(archived !== undefined ? { archivedAt: archived ? new Date() : null } : {}),
    })
    .where(and(eq(financeAccounts.id, id), eq(financeAccounts.userId, userId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });

  logActivity({
    userId,
    source: "FINANCE",
    action: "account.updated",
    title: `Cập nhật tài khoản: ${updated.name}`,
    metadata: { accountId: updated.id, archived: archived ?? false },
  });

  return NextResponse.json(updated);
});
