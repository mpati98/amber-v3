import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db";
import { SKILLS } from "@/lib/skills";

export const GET = withAuth(async (_req, userId) => {
  const rows = await db.query.skillScores.findMany({
    where: (s, { eq }) => eq(s.userId, userId),
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
});
