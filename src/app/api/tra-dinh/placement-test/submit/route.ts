import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { skillScores } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import placementTest from "@/lib/placement-test.json";
import { groqChatCompletion, parseJsonFromModel } from "@/lib/groq";
import { logActivity } from "@/lib/activity-log";

const submitSchema = z.object({
  grammarVocabularyAnswers: z.record(z.string(), z.number().int()),
  readingAnswers: z.record(z.string(), z.number().int()),
  writingResponse: z.string(),
});

type Band = { minCorrect: number; maxCorrect: number; cefr: string };

function cefrForCorrect(count: number, bands: Band[]): string | null {
  return bands.find((b) => count >= b.minCorrect && count <= b.maxCorrect)?.cefr ?? null;
}

type WritingEval = { cefrLevel: string | null; score: number | null; feedback: string };

async function gradeWriting(prompt: string, response: string): Promise<WritingEval> {
  const evalPrompt = `Bạn là giám khảo chấm bài viết tiếng Anh trình độ CEFR (A1-C2).
Đề bài: "${prompt}"
Bài làm của học viên (yêu cầu 100-150 từ):
"""
${response}
"""
Hãy chấm dựa trên các tiêu chí: ngữ pháp, từ vựng, mạch lạc (coherence), và độ dài có đủ so với yêu cầu không.
Trả lời DUY NHẤT bằng JSON hợp lệ, không thêm chữ nào khác, không bọc trong markdown, đúng schema sau:
{ "cefrLevel": "A1|A2|B1|B2|C1|C2", "score": 0-100, "feedback": "nhận xét ngắn gọn 2-3 câu bằng tiếng Việt" }`;

  try {
    const raw = await groqChatCompletion([{ role: "user", content: evalPrompt }]);
    const parsed = parseJsonFromModel<{ cefrLevel?: string; score?: number; feedback?: string }>(raw);
    if (!parsed) throw new Error("parse_failed");
    return {
      cefrLevel: parsed.cefrLevel ?? null,
      score: typeof parsed.score === "number" ? parsed.score : null,
      feedback: parsed.feedback ?? "",
    };
  } catch {
    // Groq lỗi hoặc parse JSON thất bại — không được làm hỏng cả request, trả null cho WRITING.
    return { cefrLevel: null, score: null, feedback: "Không thể chấm bài viết tự động lúc này." };
  }
}

async function upsertSkill(userId: string, skill: string, cefrLevel: string | null, score: number | null) {
  const existing = await db.query.skillScores.findFirst({
    where: and(eq(skillScores.userId, userId), eq(skillScores.skill, skill)),
  });
  if (existing) {
    await db
      .update(skillScores)
      .set({ cefrLevel, score, updatedAt: new Date() })
      .where(eq(skillScores.id, existing.id));
  } else {
    await db.insert(skillScores).values({ userId, skill, cefrLevel, score });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { grammarVocabularyAnswers, readingAnswers, writingResponse } = parsed.data;

  // Chấm điểm phía server dựa trên đáp án gốc trong file — không tin đáp án đúng từ client.
  const gvCorrect = placementTest.grammarVocabulary.filter(
    (q) => grammarVocabularyAnswers[q.id] === q.answer
  ).length;
  const gvCefr = cefrForCorrect(gvCorrect, placementTest.scoring.grammarVocabulary.bands);
  const gvScore = Math.round((gvCorrect / placementTest.scoring.grammarVocabulary.totalQuestions) * 100);

  const readingCorrect = placementTest.reading.questions.filter(
    (q) => readingAnswers[q.id] === q.answer
  ).length;
  const readingCefr = cefrForCorrect(readingCorrect, placementTest.scoring.reading.bands);
  const readingScore = Math.round((readingCorrect / placementTest.scoring.reading.totalQuestions) * 100);

  const writingEval = await gradeWriting(placementTest.writing.prompt, writingResponse);

  // grammarVocabulary trộn 2 kỹ năng — dùng chung 1 kết quả cho cả GRAMMAR và VOCABULARY.
  await upsertSkill(userId, "GRAMMAR", gvCefr, gvScore);
  await upsertSkill(userId, "VOCABULARY", gvCefr, gvScore);
  await upsertSkill(userId, "READING", readingCefr, readingScore);
  await upsertSkill(userId, "WRITING", writingEval.cefrLevel, writingEval.score);
  // LISTENING/SPEAKING không được đo bởi bài test này — không đụng tới.

  await logActivity({
    userId,
    source: "TRA_DINH",
    action: "placement_test.completed",
    title: "Hoàn thành bài test đầu vào",
    metadata: { gvCefr, readingCefr, writingCefr: writingEval.cefrLevel },
  });

  return NextResponse.json({
    results: {
      GRAMMAR: { cefrLevel: gvCefr, score: gvScore },
      VOCABULARY: { cefrLevel: gvCefr, score: gvScore },
      READING: { cefrLevel: readingCefr, score: readingScore },
      WRITING: { cefrLevel: writingEval.cefrLevel, score: writingEval.score },
    },
    writingFeedback: writingEval.feedback,
  });
}
