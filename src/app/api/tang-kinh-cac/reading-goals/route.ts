import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { readingGoals } from "@/db/schema";
import { withApiError } from "@/lib/apiError";

export const GET = withApiError(async () => {
  const goals = await db.select().from(readingGoals).orderBy(desc(readingGoals.year));
  return NextResponse.json(goals);
});

export const POST = withApiError(async (req: NextRequest) => {
  const { year, targetBooks, targetPages, note } = await req.json();
  if (!year) return NextResponse.json({ error: "year is required" }, { status: 400 });

  // ID mới dùng UUID, dữ liệu cũ có thể còn dạng cuid từ Prisma — không ảnh hưởng vì cột là text.
  // Chỉ dùng khi thật sự insert (year mới); nếu conflict, id giữ nguyên của dòng đã có.
  const [goal] = await db
    .insert(readingGoals)
    .values({
      id: randomUUID(),
      year,
      targetBooks: targetBooks ?? null,
      targetPages: targetPages ?? null,
      note: note || null,
    })
    .onConflictDoUpdate({
      target: readingGoals.year,
      // Khác topics: đây là update thật, không phải no-op. Giữ đúng bản gốc — targetBooks/
      // targetPages chỉ ghi đè khi field có mặt trong body (undefined -> Prisma bỏ qua, giữ
      // giá trị cũ), còn note luôn ghi đè (giống cả nhánh create lẫn update ở bản gốc).
      set: {
        ...(targetBooks !== undefined ? { targetBooks } : {}),
        ...(targetPages !== undefined ? { targetPages } : {}),
        note: note || null,
      },
    })
    .returning();

  return NextResponse.json(goal);
});
