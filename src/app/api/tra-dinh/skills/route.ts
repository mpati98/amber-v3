import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { SKILLS } from "@/lib/skills";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db.query.skillScores.findMany({
    where: (s, { eq }) => eq(s.userId, session.user.id),
  });
  const bySkill = new Map(rows.map((r) => [r.skill, r]));

  const result = SKILLS.map((skill) => {
    const row = bySkill.get(skill);
    return {
      skill,
      score: row?.score ?? null,
      cefrLevel: row?.cefrLevel ?? null,
      updatedAt: row?.updatedAt ?? null,
    };
  });

  return NextResponse.json(result);
}
