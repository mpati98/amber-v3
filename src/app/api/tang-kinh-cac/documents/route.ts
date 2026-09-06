import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTags, stringifyTags } from "@/lib/tags";
import { withApiError } from "@/lib/apiError";

const CONTENT_TYPES = ["TEXT", "CHECKLIST", "MINDMAP"];
const ATTACHMENT_TYPES = ["IMAGE", "FILE"];

export const GET = withApiError(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const topicId = searchParams.get("topicId");
  const pinned = searchParams.get("pinned");
  const search = searchParams.get("search");

  const items = await prisma.document.findMany({
    where: {
      ...(type ? { type: type as any } : {}),
      ...(topicId ? { topicId } : {}),
      ...(pinned === "true" ? { pinned: true } : {}),
      ...(search
        ? { OR: [{ title: { contains: search } }, { content: { contains: search } }] }
        : {}),
    },
    include: { topic: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(items.map((item) => ({ ...item, tags: parseTags(item.tags) })));
});

export const POST = withApiError(async (req: NextRequest) => {
  const body = await req.json();
  const { title, type, content, attachmentUrl, tags, pinned, sourceUrl, topicId } = body;

  if (!title || !type) {
    return NextResponse.json({ error: "title and type are required" }, { status: 400 });
  }
  if (CONTENT_TYPES.includes(type) && !content?.trim()) {
    return NextResponse.json({ error: `content is required for type ${type}` }, { status: 400 });
  }
  if (ATTACHMENT_TYPES.includes(type) && !attachmentUrl) {
    return NextResponse.json({ error: `attachmentUrl is required for type ${type}` }, { status: 400 });
  }

  const item = await prisma.document.create({
    data: {
      title,
      type,
      content: content || null,
      attachmentUrl: attachmentUrl || null,
      tags: stringifyTags(tags || []),
      pinned: !!pinned,
      sourceUrl: sourceUrl || null,
      topicId: topicId || null,
    },
    include: { topic: true },
  });

  return NextResponse.json({ ...item, tags: parseTags(item.tags) });
});
