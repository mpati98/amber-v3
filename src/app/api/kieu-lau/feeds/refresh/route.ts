import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { feedSources, feedArticlesCache } from "@/db/schema";
import { eq } from "drizzle-orm";
import Parser from "rss-parser";

const parser = new Parser({ timeout: 10000 });
const MAX_ITEMS_PER_SOURCE = 15;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sources = await db.query.feedSources.findMany({
    where: eq(feedSources.userId, session.user.id),
  });

  const failed: string[] = [];
  let refreshed = 0;

  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const feed = await parser.parseURL(source.url);
      const items = (feed.items ?? []).slice(0, MAX_ITEMS_PER_SOURCE).filter((item) => item.title && item.link);

      await db.transaction(async (tx) => {
        // Cache tạm — xóa hết bản cũ của nguồn này rồi chèn lại, không tích lũy lịch sử
        await tx.delete(feedArticlesCache).where(eq(feedArticlesCache.sourceId, source.id));
        if (items.length > 0) {
          await tx.insert(feedArticlesCache).values(
            items.map((item) => ({
              sourceId: source.id,
              title: item.title!.slice(0, 500),
              url: item.link!,
              publishedAt: item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : null,
            }))
          );
        }
      });
    })
  );

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      refreshed++;
    } else {
      failed.push(sources[i].name);
    }
  });

  return NextResponse.json({ refreshed, failed });
}
