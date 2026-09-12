import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { feedSources } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sources = await db.query.feedSources.findMany({
    where: eq(feedSources.userId, session.user.id),
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
}
