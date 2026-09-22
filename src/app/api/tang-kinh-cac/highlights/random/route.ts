import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { highlights } from "@/db/schema";
import { withApiError } from "@/lib/apiError";

export const GET = withApiError(async () => {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(highlights);
  if (count === 0) return NextResponse.json(null);

  // Random uniform thật trên toàn bộ highlights (không giới hạn theo publication, không ưu
  // tiên gì) — khác thuật toán ở documents/random và không phải ORDER BY random() ở DB, giữ
  // đúng cách cũ: random 1 offset rồi skip/take.
  const skip = Math.floor(Math.random() * count);
  const rows = await db.query.highlights.findMany({
    limit: 1,
    offset: skip,
    with: {
      publication: {
        columns: { title: true, author: true, coverUrl: true },
      },
    },
  });

  return NextResponse.json(rows[0] ?? null);
});
