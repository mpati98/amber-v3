import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const patchTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["PREP", "WAITING", "IN_PROGRESS", "DONE"]).optional(),
  projectId: z.string().uuid().nullable().optional(),
  importance: z.number().int().min(1).max(3).optional(),
  urgency: z.number().int().min(1).max(3).optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  prepLeadDays: z.number().int().nullable().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = patchTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "empty patch" }, { status: 400 });
  }

  // and(...) đảm bảo chỉ sửa được task của chính user đang đăng nhập, không đoán ID người khác được
  const [updated] = await db
    .update(tasks)
    .set(parsed.data)
    .where(and(eq(tasks.id, id), eq(tasks.userId, session.user.id)))
    .returning();
  if (!updated) {
    return NextResponse.json({ error: "task not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [deleted] = await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, session.user.id)))
    .returning();
  if (!deleted) {
    return NextResponse.json({ error: "task not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
