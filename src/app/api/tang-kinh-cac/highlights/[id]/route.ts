import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiError } from "@/lib/apiError";

export const PATCH = withApiError(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { quote, page, note } = await req.json();
  const highlight = await prisma.highlight.update({
    where: { id },
    data: {
      ...(quote !== undefined ? { quote } : {}),
      ...(page !== undefined ? { page } : {}),
      ...(note !== undefined ? { note: note || null } : {}),
    },
  });
  return NextResponse.json(highlight);
});

export const DELETE = withApiError(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await prisma.highlight.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
