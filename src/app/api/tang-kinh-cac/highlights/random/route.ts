import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiError } from "@/lib/apiError";

export const GET = withApiError(async () => {
  const count = await prisma.highlight.count();
  if (count === 0) return NextResponse.json(null);

  const skip = Math.floor(Math.random() * count);
  const [highlight] = await prisma.highlight.findMany({
    take: 1,
    skip,
    include: { publication: { select: { title: true, author: true, coverUrl: true } } },
  });

  return NextResponse.json(highlight ?? null);
});
