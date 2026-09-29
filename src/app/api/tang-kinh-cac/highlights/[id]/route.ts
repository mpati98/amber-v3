import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { highlights } from "@/db/schema";
import { withAuth } from "@/lib/withAuth";

export const PATCH = withAuth(async (req, _userId, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { quote, page, note } = await req.json();

  const [updated] = await db
    .update(highlights)
    .set({
      ...(quote !== undefined ? { quote } : {}),
      ...(page !== undefined ? { page } : {}),
      ...(note !== undefined ? { note: note || null } : {}),
    })
    .where(eq(highlights.id, id))
    .returning();

  // Prisma.update ném lỗi khi id không tồn tại -> withApiError bắt -> 500 (không có check tồn tại
  // tường minh trong bản gốc, giống documents, khác publications). Giữ đúng hành vi cũ.
  if (!updated) {
    throw new Error("highlight not found");
  }

  return NextResponse.json(updated);
});

export const DELETE = withAuth(async (_req, _userId, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const [deleted] = await db.delete(highlights).where(eq(highlights.id, id)).returning();

  if (!deleted) {
    throw new Error("highlight not found");
  }

  return NextResponse.json({ success: true });
});
