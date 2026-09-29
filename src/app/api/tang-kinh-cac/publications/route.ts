import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, desc, eq, like, or } from "drizzle-orm";
import { db } from "@/db";
import { publications, publicationFormat, publicationStatus } from "@/db/schema";
import { parseTags, stringifyTags } from "@/lib/tags";
import { withAuth } from "@/lib/withAuth";

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const format = searchParams.get("format");
  const search = searchParams.get("search");

  const conditions = [
    status ? eq(publications.status, status as (typeof publicationStatus.enumValues)[number]) : undefined,
    format ? eq(publications.format, format as (typeof publicationFormat.enumValues)[number]) : undefined,
    search ? or(like(publications.title, `%${search}%`), like(publications.author, `%${search}%`)) : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);

  const items = await db.query.publications.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: desc(publications.dateAdded),
  });

  return NextResponse.json(items.map((item) => ({ ...item, tags: parseTags(item.tags) })));
});

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const { title, author, isbn, coverUrl, format, status, tags, url, review, notes, totalPages } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  // ID mới dùng UUID, dữ liệu cũ có thể còn dạng cuid từ Prisma — không ảnh hưởng vì cột là text
  const [created] = await db
    .insert(publications)
    .values({
      id: randomUUID(),
      title,
      author: author || null,
      isbn: isbn || null,
      coverUrl: coverUrl || null,
      format: (format || "PHYSICAL") as (typeof publicationFormat.enumValues)[number],
      status: (status || "TO_READ") as (typeof publicationStatus.enumValues)[number],
      tags: stringifyTags(tags || []),
      url: url || null,
      review: review || null,
      notes: notes || null,
      totalPages: totalPages ?? null,
      dateStarted: status === "READING" ? new Date().toISOString() : null,
    })
    .returning();

  return NextResponse.json({ ...created, tags: parseTags(created.tags) });
});
