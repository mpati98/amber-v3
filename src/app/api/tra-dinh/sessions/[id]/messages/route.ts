import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { projects, practiceMessages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { buildTutorSystemPrompt, groqChatCompletion, type ChatMessage } from "@/lib/groq";

const sendMessageSchema = z.object({
  content: z.string().min(1),
  audioUrl: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const body = await req.json();
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { content, audioUrl } = parsed.data;

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, session.user.id), eq(projects.type, "PRACTICE")),
    with: { practiceDetails: true, practiceMessages: { orderBy: (m, { asc }) => asc(m.createdAt) } },
  });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (project.archivedAt) return NextResponse.json({ error: "session_ended" }, { status: 400 });

  const [userMessage] = await db
    .insert(practiceMessages)
    .values({ projectId: id, role: "USER", content, audioUrl: audioUrl || null })
    .returning();

  const history: ChatMessage[] = [
    { role: "system", content: buildTutorSystemPrompt(project.practiceDetails?.mode ?? "CONVERSATION") },
    ...project.practiceMessages.map((m) => ({
      role: (m.role === "USER" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content },
  ];

  let assistantContent: string;
  try {
    assistantContent = await groqChatCompletion(history);
  } catch {
    return NextResponse.json({ error: "ai_unavailable" }, { status: 502 });
  }

  const [assistantMessage] = await db
    .insert(practiceMessages)
    .values({ projectId: id, role: "ASSISTANT", content: assistantContent })
    .returning();

  return NextResponse.json({ userMessage, assistantMessage }, { status: 201 });
}
