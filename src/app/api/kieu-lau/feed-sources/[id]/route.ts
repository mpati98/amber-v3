import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db";
import { feedSources } from "@/db/schema";
import { logActivity } from "@/lib/activity-log";
import { and, eq } from "drizzle-orm";

export const DELETE = withAuth(async (_req, userId, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const [deleted] = await db
    .delete(feedSources)
    .where(and(eq(feedSources.id, id), eq(feedSources.userId, userId)))
    .returning();
  if (!deleted) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  logActivity({
    userId,
    source: "KIEU_LAU",
    action: "feed_source.deleted",
    title: `Xóa nguồn tin: ${deleted.name}`,
    metadata: { sourceId: deleted.id },
  });

  return NextResponse.json({ ok: true });
});
