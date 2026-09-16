import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import placementTest from "@/lib/placement-test.json";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { testId, title, description, instructions, grammarVocabulary, reading, writing } = placementTest;

  return NextResponse.json({
    testId,
    title,
    description,
    instructions,
    // Không được để lộ field "answer" ra client — chấm điểm chỉ diễn ra ở server.
    grammarVocabulary: grammarVocabulary.map(({ answer: _answer, ...q }) => q),
    reading: {
      passage: reading.passage,
      questions: reading.questions.map(({ answer: _answer, ...q }) => q),
    },
    writing,
  });
}
