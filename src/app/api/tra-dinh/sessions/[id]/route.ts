import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { projects, practiceSessionDetails, skillScores } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { groqChatCompletion, parseJsonFromModel } from "@/lib/groq";
import { SKILLS, type Skill } from "@/lib/skills";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, session.user.id), eq(projects.type, "PRACTICE")),
    with: {
      practiceDetails: true,
      practiceMessages: { orderBy: (m, { asc }) => asc(m.createdAt) },
    },
  });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(project);
}

type EvalResult = {
  summary: string;
  skills?: Partial<Record<Skill, { score?: number; cefrLevel?: string }>>;
};

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const userId = session.user.id;

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, userId), eq(projects.type, "PRACTICE")),
    with: {
      practiceDetails: true,
      practiceMessages: { orderBy: (m, { asc }) => asc(m.createdAt) },
    },
  });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const transcript = project.practiceMessages
    .map((m) => `${m.role === "USER" ? "Học viên" : "Gia sư"}: ${m.content}`)
    .join("\n");

  let evalResult: EvalResult | null = null;
  if (transcript.trim().length > 0) {
    const evalPrompt = `Dưới đây là bản ghi 1 buổi luyện tập tiếng Anh giữa học viên và gia sư AI:

${transcript}

Hãy đóng vai giám khảo đánh giá buổi luyện tập này. Trả lời DUY NHẤT bằng JSON hợp lệ, không thêm chữ nào khác, không bọc trong markdown, đúng schema sau:
{
  "summary": "tóm tắt ngắn gọn (2-4 câu, tiếng Việt) về nội dung buổi luyện và tiến bộ/điểm cần cải thiện của học viên",
  "skills": {
    "GRAMMAR": { "score": 0-100, "cefrLevel": "A1|A2|B1|B2|C1|C2" },
    "VOCABULARY": { "score": 0-100, "cefrLevel": "A1|A2|B1|B2|C1|C2" },
    "LISTENING": { "score": 0-100, "cefrLevel": "A1|A2|B1|B2|C1|C2" },
    "SPEAKING": { "score": 0-100, "cefrLevel": "A1|A2|B1|B2|C1|C2" },
    "READING": { "score": 0-100, "cefrLevel": "A1|A2|B1|B2|C1|C2" },
    "WRITING": { "score": 0-100, "cefrLevel": "A1|A2|B1|B2|C1|C2" }
  }
}
Chỉ đánh giá những kỹ năng thực sự thể hiện rõ trong bản ghi (ví dụ buổi chat văn bản thì khó đánh giá LISTENING/SPEAKING) — với kỹ năng không đủ căn cứ, bỏ qua field đó trong "skills" thay vì đoán bừa.`;

    try {
      const raw = await groqChatCompletion([{ role: "user", content: evalPrompt }]);
      evalResult = parseJsonFromModel<EvalResult>(raw);
    } catch {
      // Groq lỗi hoặc parse JSON thất bại — vẫn kết thúc buổi bình thường, chỉ là không có summary/skill mới.
      evalResult = null;
    }
  }

  const now = new Date();

  const result = await db.transaction(async (tx) => {
    const [updatedProject] = await tx
      .update(projects)
      .set({ archivedAt: now })
      .where(eq(projects.id, id))
      .returning();

    const [updatedDetails] = await tx
      .update(practiceSessionDetails)
      .set({ summary: evalResult?.summary ?? project.practiceDetails?.summary ?? null })
      .where(eq(practiceSessionDetails.projectId, id))
      .returning();

    if (evalResult?.skills) {
      for (const skill of SKILLS) {
        const skillEval = evalResult.skills[skill];
        if (!skillEval) continue;

        const existing = await tx.query.skillScores.findFirst({
          where: and(eq(skillScores.userId, userId), eq(skillScores.skill, skill)),
        });
        if (existing) {
          await tx
            .update(skillScores)
            .set({
              score: skillEval.score ?? existing.score,
              cefrLevel: skillEval.cefrLevel ?? existing.cefrLevel,
              updatedAt: now,
            })
            .where(eq(skillScores.id, existing.id));
        } else {
          await tx.insert(skillScores).values({
            userId,
            skill,
            score: skillEval.score ?? null,
            cefrLevel: skillEval.cefrLevel ?? null,
          });
        }
      }
    }

    return { ...updatedProject, practiceDetails: updatedDetails };
  });

  return NextResponse.json(result);
}
