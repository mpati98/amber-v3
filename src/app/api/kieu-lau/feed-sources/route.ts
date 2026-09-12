import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { feedSources } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createFeedSourceSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db.query.feedSources.findMany({
    where: eq(feedSources.userId, session.user.id),
    orderBy: (f, { desc }) => desc(f.createdAt),
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createFeedSourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db
    .insert(feedSources)
    .values({ ...parsed.data, userId: session.user.id })
    .returning();
  return NextResponse.json(created, { status: 201 });
}
