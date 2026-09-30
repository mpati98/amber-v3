import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { learnLessons, projects } from "@/db/schema";

// Kiểm tra quyền sở hữu cho Học tập. learnLessons không có cột userId — quyền
// đi theo khóa học (project type LEARN) chứa bài học. Cả "không tồn tại" lẫn
// "của người khác" đều trả undefined → route trả cùng 1 mã 404, không lộ
// thông tin id nào đang tồn tại.

/** Khóa học [courseId] nếu là project LEARN của [userId]. */
export async function findOwnedCourse(courseId: string, userId: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, courseId), eq(projects.userId, userId), eq(projects.type, "LEARN")),
  });
}

/** Bài học [lessonId] nếu thuộc 1 khóa học của [userId]. */
export async function findOwnedLesson(lessonId: string, userId: string) {
  const [row] = await db
    .select({ lesson: learnLessons })
    .from(learnLessons)
    .innerJoin(projects, eq(projects.id, learnLessons.projectId))
    .where(and(eq(learnLessons.id, lessonId), eq(projects.userId, userId), eq(projects.type, "LEARN")))
    .limit(1);
  return row?.lesson;
}
