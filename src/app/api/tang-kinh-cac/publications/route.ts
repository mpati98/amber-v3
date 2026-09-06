import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTags, stringifyTags } from "@/lib/tags";
import { withApiError } from "@/lib/apiError";

export const GET = withApiError(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const format = searchParams.get("format");
  const search = searchParams.get("search");

  const items = await prisma.publication.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(format ? { format: format as any } : {}),
      ...(search
        ? { OR: [{ title: { contains: search } }, { author: { contains: search } }] }
        : {}),
    },
    orderBy: { dateAdded: "desc" },
  });

  return NextResponse.json(items.map((item) => ({ ...item, tags: parseTags(item.tags) })));
});

export const POST = withApiError(async (req: NextRequest) => {
  const body = await req.json();
  const { title, author, isbn, coverUrl, format, status, tags, url, review, notes, totalPages } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const item = await prisma.publication.create({
    data: {
      title,
      author: author || null,
      isbn: isbn || null,
      coverUrl: coverUrl || null,
      format: format || "PHYSICAL",
      status: status || "TO_READ",
      tags: stringifyTags(tags || []),
      url: url || null,
      review: review || null,
      notes: notes || null,
      totalPages: totalPages ?? null,
      dateStarted: status === "READING" ? new Date() : null,
    },
  });

  return NextResponse.json({ ...item, tags: parseTags(item.tags) });
});
