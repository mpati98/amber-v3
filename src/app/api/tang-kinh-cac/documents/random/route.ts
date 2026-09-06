import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTags } from "@/lib/tags";
import { withApiError } from "@/lib/apiError";

export const GET = withApiError(async () => {
  const count = await prisma.document.count();
  if (count === 0) return NextResponse.json(null);

  // Ưu tiên tài liệu lâu chưa xem: lấy nửa số bản ghi cũ nhất theo updatedAt, rồi random trong đó
  const poolSize = Math.max(3, Math.ceil(count / 2));
  const pool = await prisma.document.findMany({
    take: poolSize,
    orderBy: { updatedAt: "asc" },
    include: { topic: true },
  });

  const pick = pool[Math.floor(Math.random() * pool.length)];
  return NextResponse.json({ ...pick, tags: parseTags(pick.tags) });
});
