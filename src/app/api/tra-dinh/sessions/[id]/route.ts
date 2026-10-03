import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db";
import { projects, practiceSessionDetails, skillScores } from "@/db/schema";
import { logActivity } from "@/lib/activity-log";
import { eq, and } from "drizzle-orm";
import { aiUnavailableResponse, GroqError, groqChatCompletion, parseJsonFromModel } from "@/lib/groq";
import { SKILLS, validCefrLevel, type Skill } from "@/lib/skills";

// PATCH gọi Groq đánh giá cả buổi (timeout 45s trong lib/groq.ts).
export const maxDuration = 60;

export const GET = withAuth(async (_req, userId, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, userId), eq(projects.type, "PRACTICE")),
    with: {
      practiceDetails: true,
      practiceMessages: { orderBy: (m, { asc }) => asc(m.createdAt) },
    },
  });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(project);
});

type EvalResult = {
  summary: string;
  skills?: Partial<Record<Skill, { score?: number; cefrLevel?: string }>>;
};

export const PATCH = withAuth(async (_req, userId, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

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

    // Groq lỗi/timeout hoặc trả JSON không hợp lệ → KHÔNG lưu trữ buổi, KHÔNG ghi
    // điểm, trả 502 để client thử lại (buổi vẫn mở, không mất tóm tắt/điểm).
    try {
      const raw = await groqChatCompletion([{ role: "user", content: evalPrompt }]);
      evalResult = parseJsonFromModel<EvalResult>(raw);
      if (!evalResult || typeof evalResult.summary !== "string" || !evalResult.summary.trim()) {
        throw new GroqError(`Groq evaluation returned invalid JSON: ${raw.slice(0, 200)}`);
      }
    } catch (err) {
      return aiUnavailableResponse(err);
    }
  }
  // Bản ghi rỗng (chưa nhắn tin nào): không gọi AI, kết thúc buổi không tóm tắt/điểm như trước.

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
        // Cột skill_scores.score là integer — LLM có thể trả số lẻ (72.5), ghi
        // thẳng sẽ lỗi và rollback cả việc kết thúc buổi. Không phải số hữu hạn
        // thì coi như AI không chấm kỹ năng này.
        const aiScore =
          typeof skillEval.score === "number" && Number.isFinite(skillEval.score) ? Math.round(skillEval.score) : null;
        const aiCefr = validCefrLevel(skillEval.cefrLevel);

        const existing = await tx.query.skillScores.findFirst({
          where: and(eq(skillScores.userId, userId), eq(skillScores.skill, skill)),
        });
        if (existing) {
          await tx
            .update(skillScores)
            .set({
              score: aiScore ?? existing.score,
              cefrLevel: aiCefr ?? existing.cefrLevel,
              updatedAt: now,
            })
            .where(eq(skillScores.id, existing.id));
        } else {
          await tx.insert(skillScores).values({
            userId,
            skill,
            score: aiScore,
            cefrLevel: aiCefr,
          });
        }
      }
    }

    return { ...updatedProject, practiceDetails: updatedDetails };
  });

  logActivity({
    userId,
    source: "TRA_DINH",
    action: "session.closed",
    title: `Kết thúc buổi: ${project.name}`,
    metadata: { sessionId: result.id, summary: evalResult?.summary ?? project.practiceDetails?.summary ?? undefined },
  });

  return NextResponse.json(result);
});
