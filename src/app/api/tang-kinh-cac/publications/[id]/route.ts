import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { publications, publicationFormat, publicationStatus } from "@/db/schema";
import { parseTags, stringifyTags } from "@/lib/tags";
import { withApiError } from "@/lib/apiError";

export const PATCH = withApiError(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await req.json();
  const {
    title, author, isbn, coverUrl, format, status, rating,
    currentPage, totalPages, tags, url, review, notes,
  } = body;

  const [existing] = await db.select().from(publications).where(eq(publications.id, id));
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let dateStarted = existing.dateStarted;
  let dateFinished = existing.dateFinished;
  if (status !== undefined && status !== existing.status) {
    if (status === "READING" && !dateStarted) dateStarted = new Date().toISOString();
    if (status === "READ") dateFinished = new Date().toISOString();
    if (status === "TO_READ") {
      dateStarted = null;
      dateFinished = null;
    }
  }

  const [item] = await db
    .update(publications)
    .set({
      ...(title !== undefined ? { title } : {}),
      ...(author !== undefined ? { author: author || null } : {}),
      ...(isbn !== undefined ? { isbn: isbn || null } : {}),
      ...(coverUrl !== undefined ? { coverUrl: coverUrl || null } : {}),
      ...(format !== undefined ? { format: format as (typeof publicationFormat.enumValues)[number] } : {}),
      ...(status !== undefined
        ? { status: status as (typeof publicationStatus.enumValues)[number], dateStarted, dateFinished }
        : {}),
      ...(rating !== undefined ? { rating: rating || null } : {}),
      ...(currentPage !== undefined ? { currentPage } : {}),
      ...(totalPages !== undefined ? { totalPages } : {}),
      ...(tags !== undefined ? { tags: stringifyTags(tags) } : {}),
      ...(url !== undefined ? { url: url || null } : {}),
      ...(review !== undefined ? { review: review || null } : {}),
      ...(notes !== undefined ? { notes: notes || null } : {}),
    })
    .where(eq(publications.id, id))
    .returning();

  return NextResponse.json({ ...item, tags: parseTags(item.tags) });
});

export const DELETE = withApiError(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const [deleted] = await db.delete(publications).where(eq(publications.id, id)).returning();

  // Prisma.delete ném lỗi khi id không tồn tại -> withApiError bắt -> 500 (DELETE không có
  // check tồn tại tường minh như PATCH trong file này — giữ đúng hành vi khác nhau đó).
  if (!deleted) {
    throw new Error("publication not found");
  }

  return NextResponse.json({ success: true });
});
