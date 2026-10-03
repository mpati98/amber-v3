import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db";
import { projects, practiceMessages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { aiUnavailableResponse, buildTutorSystemPrompt, groqChatCompletion, type ChatMessage } from "@/lib/groq";

// Gọi Groq (timeout 45s trong lib/groq.ts) — chừa thêm thời gian cho DB.
export const maxDuration = 60;

const sendMessageSchema = z.object({
  content: z.string().min(1),
  audioUrl: z.string().optional(),
});

export const POST = withAuth(async (req, userId, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const body = await req.json();
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { content, audioUrl } = parsed.data;

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, userId), eq(projects.type, "PRACTICE")),
    with: { practiceDetails: true, practiceMessages: { orderBy: (m, { asc }) => asc(m.createdAt) } },
  });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (project.archivedAt) return NextResponse.json({ error: "session_ended" }, { status: 400 });

  // Thời điểm người học gửi — ghi tường minh vì tin user giờ chỉ được insert
  // sau khi AI trả lời (cùng transaction với tin assistant, mà defaultNow() trong
  // 1 transaction trả cùng 1 giá trị → 2 tin trùng created_at, thứ tự lẫn lộn).
  const sentAt = new Date();

  const history: ChatMessage[] = [
    { role: "system", content: buildTutorSystemPrompt(project.practiceDetails?.mode ?? "CONVERSATION") },
    ...project.practiceMessages.map((m) => ({
      role: (m.role === "USER" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content },
  ];

  // Tin mới đã nằm cuối history (lấy từ body, không cần có trong DB) — gọi AI
  // trước, lỗi thì không ghi gì: trước đây tin user được ghi trước, AI lỗi để
  // lại tin mồ côi, người dùng gửi lại → tin trùng.
  let assistantContent: string;
  try {
    assistantContent = await groqChatCompletion(history);
  } catch (err) {
    return aiUnavailableResponse(err);
  }
  const repliedAt = new Date();

  const { userMessage, assistantMessage } = await db.transaction(async (tx) => {
    const [userMessage] = await tx
      .insert(practiceMessages)
      .values({ projectId: id, role: "USER", content, audioUrl: audioUrl || null, createdAt: sentAt })
      .returning();
    const [assistantMessage] = await tx
      .insert(practiceMessages)
      .values({ projectId: id, role: "ASSISTANT", content: assistantContent, createdAt: repliedAt })
      .returning();
    return { userMessage, assistantMessage };
  });

  return NextResponse.json({ userMessage, assistantMessage }, { status: 201 });
});
