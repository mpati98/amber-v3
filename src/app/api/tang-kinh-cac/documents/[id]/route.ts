import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTags, stringifyTags } from "@/lib/tags";
import { withApiError } from "@/lib/apiError";

export const PATCH = withApiError(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await req.json();
  const { title, content, attachmentUrl, tags, pinned, sourceUrl, topicId } = body;

  const item = await prisma.document.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(content !== undefined ? { content: content || null } : {}),
      ...(attachmentUrl !== undefined ? { attachmentUrl: attachmentUrl || null } : {}),
      ...(tags !== undefined ? { tags: stringifyTags(tags) } : {}),
      ...(pinned !== undefined ? { pinned } : {}),
      ...(sourceUrl !== undefined ? { sourceUrl: sourceUrl || null } : {}),
      ...(topicId !== undefined ? { topicId: topicId || null } : {}),
    },
    include: { topic: true },
  });

  return NextResponse.json({ ...item, tags: parseTags(item.tags) });
});

export const DELETE = withApiError(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
