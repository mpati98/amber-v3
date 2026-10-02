import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import placementTest from "@/lib/placement-test.json";

export const GET = withAuth(async () => {
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
});
