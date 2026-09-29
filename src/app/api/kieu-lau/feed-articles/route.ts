import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db";
import { feedSources } from "@/db/schema";
import { eq } from "drizzle-orm";

export const GET = withAuth(async (_req, userId) => {
  const sources = await db.query.feedSources.findMany({
    where: eq(feedSources.userId, userId),
    with: { articles: true },
  });

  const articles = sources
    .flatMap((source) =>
      source.articles.map((a) => ({
        id: a.id,
        title: a.title,
        url: a.url,
        publishedAt: a.publishedAt,
        sourceName: source.name,
      }))
    )
    .sort((a, b) => {
      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bTime - aTime;
    });

  return NextResponse.json(articles);
});
