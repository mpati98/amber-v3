import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { groqTranscribe } from "@/lib/groq";

export const POST = withAuth(async (req) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Thiếu file audio" }, { status: 400 });

  try {
    const text = await groqTranscribe(file);
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "ai_unavailable" }, { status: 502 });
  }
});
