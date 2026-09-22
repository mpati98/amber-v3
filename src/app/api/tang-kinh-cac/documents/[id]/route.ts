import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { parseTags, stringifyTags } from "@/lib/tags";
import { withApiError } from "@/lib/apiError";

export const PATCH = withApiError(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await req.json();
  const { title, content, attachmentUrl, tags, pinned, sourceUrl, topicId } = body;

  const [updated] = await db
    .update(documents)
    .set({
      ...(title !== undefined ? { title } : {}),
      ...(content !== undefined ? { content: content || null } : {}),
      ...(attachmentUrl !== undefined ? { attachmentUrl: attachmentUrl || null } : {}),
      ...(tags !== undefined ? { tags: stringifyTags(tags) } : {}),
      ...(pinned !== undefined ? { pinned } : {}),
      ...(sourceUrl !== undefined ? { sourceUrl: sourceUrl || null } : {}),
      ...(topicId !== undefined ? { topicId: topicId || null } : {}),
      // Prisma @updatedAt tự bump trên MỌI update, kể cả khi field khác rỗng — giữ đúng hành vi
      updatedAt: new Date().toISOString(),
    })
    .where(eq(documents.id, id))
    .returning();

  // Prisma.update ném lỗi khi id không tồn tại -> withApiError bắt -> 500. Giữ đúng hành vi cũ,
  // không đổi thành 404 dù đó không phải REST convention lý tưởng.
  if (!updated) {
    throw new Error("document not found");
  }

  const item = await db.query.documents.findFirst({
    where: eq(documents.id, id),
    with: { topic: true },
  });

  return NextResponse.json({ ...item!, tags: parseTags(item!.tags) });
});

export const DELETE = withApiError(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const [deleted] = await db.delete(documents).where(eq(documents.id, id)).returning();

  // Cùng lý do như PATCH — giữ đúng hành vi 500 khi không tìm thấy, không đổi thành 404.
  if (!deleted) {
    throw new Error("document not found");
  }

  return NextResponse.json({ success: true });
});
