import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiError } from "@/lib/apiError";

export const GET = withApiError(async (_req: NextRequest, { params }: { params: Promise<{ year: string }> }) => {
  const { year: yearParam } = await params;
  const year = Number(yearParam);

  const goal = await prisma.readingGoal.findUnique({ where: { year } });

  const start = new Date(`${year}-01-01T00:00:00`);
  const end = new Date(`${year}-12-31T23:59:59`);

  const finishedInYear = await prisma.publication.findMany({
    where: { status: "READ", dateFinished: { gte: start, lte: end } },
    select: { totalPages: true },
  });

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
