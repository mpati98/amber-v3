import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiError } from "@/lib/apiError";

export const GET = withApiError(async () => {
  const goals = await prisma.readingGoal.findMany({ orderBy: { year: "desc" } });
  return NextResponse.json(goals);
});

export const POST = withApiError(async (req: NextRequest) => {
  const { year, targetBooks, targetPages, note } = await req.json();
  if (!year) return NextResponse.json({ error: "year is required" }, { status: 400 });

  const goal = await prisma.readingGoal.upsert({
    where: { year },
    update: { targetBooks, targetPages, note: note || null },
    create: { year, targetBooks: targetBooks ?? null, targetPages: targetPages ?? null, note: note || null },
  });

  return NextResponse.json(goal);
});
