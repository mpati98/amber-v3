import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { publications, readingGoals } from "@/db/schema";
import { withApiError } from "@/lib/apiError";

export const GET = withApiError(async (_req: NextRequest, { params }: { params: Promise<{ year: string }> }) => {
  const { year: yearParam } = await params;
  const year = Number(yearParam);

  const [goal] = await db.select().from(readingGoals).where(eq(readingGoals.year, year));

  // Giữ nguyên đúng cách dựng mốc ngày của bản gốc — new Date() không có 'Z' parse theo
  // local timezone của server, không đổi sang UTC/EXTRACT(YEAR FROM ...) để tránh lệch hành vi.
  const start = new Date(`${year}-01-01T00:00:00`);
  const end = new Date(`${year}-12-31T23:59:59`);

  const finishedInYear = await db
    .select({ totalPages: publications.totalPages })
    .from(publications)
    .where(
      and(
        eq(publications.status, "READ"),
        gte(publications.dateFinished, start.toISOString()),
        lte(publications.dateFinished, end.toISOString())
      )
    );

  const booksRead = finishedInYear.length;
  const pagesRead = finishedInYear.reduce((sum, p) => sum + (p.totalPages || 0), 0);

  return NextResponse.json({
    year,
    targetBooks: goal?.targetBooks ?? null,
    targetPages: goal?.targetPages ?? null,
    note: goal?.note ?? null,
    booksRead,
    pagesRead,
  });
});
