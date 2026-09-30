import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";

/** Project [projectId] có thuộc [userId] không (mọi loại project). */
export async function userOwnsProject(projectId: string, userId: string): Promise<boolean> {
  const row = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
    columns: { id: true },
  });
  return row !== undefined;
}
