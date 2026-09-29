import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db";
import { feedSources } from "@/db/schema";
import { logActivity } from "@/lib/activity-log";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createFeedSourceSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
});

export const GET = withAuth(async (_req, userId) => {
  const rows = await db.query.feedSources.findMany({
    where: eq(feedSources.userId, userId),
    orderBy: (f, { desc }) => desc(f.createdAt),
  });
  return NextResponse.json(rows);
});

export const POST = withAuth(async (req, userId) => {
  const body = await req.json();
  const parsed = createFeedSourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db
    .insert(feedSources)
    .values({ ...parsed.data, userId })
    .returning();

  logActivity({
    userId,
    source: "KIEU_LAU",
    action: "feed_source.created",
    title: `Thêm nguồn tin: ${created.name}`,
    metadata: { sourceId: created.id, url: created.url },
  });

  return NextResponse.json(created, { status: 201 });
});
