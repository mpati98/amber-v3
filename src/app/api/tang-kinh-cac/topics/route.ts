import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { documents, topics } from "@/db/schema";
import { withApiError } from "@/lib/apiError";

export const GET = withApiError(async () => {
  const rows = await db
    .select({
      id: topics.id,
      name: topics.name,
      description: topics.description,
      _count: {
        documents: sql<number>`count(${documents.id})::int`,
      },
    })
    .from(topics)
    .leftJoin(documents, eq(documents.topicId, topics.id))
    .groupBy(topics.id)
    .orderBy(asc(topics.name));

  return NextResponse.json(rows);
});

export const POST = withApiError(async (req: NextRequest) => {
  const { name, description } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const [topic] = await db
    .insert(topics)
    .values({ id: randomUUID(), name: name.trim(), description: description || null })
    .onConflictDoUpdate({
      target: topics.name,
      set: { name: sql`excluded.name` },
    })
    .returning();

  return NextResponse.json(topic);
});
