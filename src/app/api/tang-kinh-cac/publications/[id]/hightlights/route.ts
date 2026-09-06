import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiError } from "@/lib/apiError";

export const GET = withApiError(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;
    const highlights = await prisma.highlight.findMany({
      where: { publicationId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(highlights);
  },
);

export const POST = withApiError(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const { quote, page, note } = await req.json();

    if (!quote?.trim()) {
      return NextResponse.json({ error: "quote is required" }, { status: 400 });
    }

    const highlight = await prisma.highlight.create({
      data: {
        publicationId: id,
        quote,
        page: page ?? null,
        note: note || null,
      },
    });

    return NextResponse.json(highlight);
  },
);
