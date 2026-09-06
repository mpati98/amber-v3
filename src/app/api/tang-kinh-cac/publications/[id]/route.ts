import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTags, stringifyTags } from "@/lib/tags";
import { withApiError } from "@/lib/apiError";

export const PATCH = withApiError(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await req.json();
  const {
    title, author, isbn, coverUrl, format, status, rating,
    currentPage, totalPages, tags, url, review, notes,
  } = body;

  const existing = await prisma.publication.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let dateStarted = existing.dateStarted;
  let dateFinished = existing.dateFinished;
  if (status !== undefined && status !== existing.status) {
    if (status === "READING" && !dateStarted) dateStarted = new Date();
    if (status === "READ") dateFinished = new Date();
    if (status === "TO_READ") { dateStarted = null; dateFinished = null; }
  }

  const item = await prisma.publication.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(author !== undefined ? { author: author || null } : {}),
      ...(isbn !== undefined ? { isbn: isbn || null } : {}),
      ...(coverUrl !== undefined ? { coverUrl: coverUrl || null } : {}),
      ...(format !== undefined ? { format } : {}),
      ...(status !== undefined ? { status, dateStarted, dateFinished } : {}),
      ...(rating !== undefined ? { rating: rating || null } : {}),
      ...(currentPage !== undefined ? { currentPage } : {}),
      ...(totalPages !== undefined ? { totalPages } : {}),
      ...(tags !== undefined ? { tags: stringifyTags(tags) } : {}),
      ...(url !== undefined ? { url: url || null } : {}),
      ...(review !== undefined ? { review: review || null } : {}),
      ...(notes !== undefined ? { notes: notes || null } : {}),
    },
  });

  return NextResponse.json({ ...item, tags: parseTags(item.tags) });
});

export const DELETE = withApiError(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await prisma.publication.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
