import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiError } from "@/lib/apiError";

export const GET = withApiError(async () => {
  const topics = await prisma.topic.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { documents: true } } },
  });
  return NextResponse.json(topics);
});

export const POST = withApiError(async (req: NextRequest) => {
  const { name, description } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const topic = await prisma.topic.upsert({
    where: { name: name.trim() },
    update: {},
    create: { name: name.trim(), description: description || null },
  });
  return NextResponse.json(topic);
});
