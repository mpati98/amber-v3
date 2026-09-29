import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { highlights } from "@/db/schema";
import { withAuth } from "@/lib/withAuth";

export const GET = withAuth(async (_req, _userId, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const rows = await db
    .select()
    .from(highlights)
    .where(eq(highlights.publicationId, id))
    .orderBy(desc(highlights.createdAt));
  return NextResponse.json(rows);
});

export const POST = withAuth(async (req, _userId, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { quote, page, note } = await req.json();

  if (!quote?.trim()) {
    return NextResponse.json({ error: "quote is required" }, { status: 400 });
  }

  // ID mới dùng UUID, dữ liệu cũ có thể còn dạng cuid từ Prisma — không ảnh hưởng vì cột là text.
  // Không tự check publication tồn tại trước — giữ đúng bản gốc, để FK constraint ở DB tự throw
  // nếu publicationId sai (lỗi đó rơi vào withApiError -> 500, giống hành vi Prisma cũ).
  const [created] = await db
    .insert(highlights)
    .values({ id: randomUUID(), publicationId: id, quote, page: page ?? null, note: note || null })
    .returning();

  return NextResponse.json(created);
});
