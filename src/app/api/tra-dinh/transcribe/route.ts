import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { groqTranscribe } from "@/lib/groq";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Thiếu file audio" }, { status: 400 });

  try {
    const text = await groqTranscribe(file);
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "ai_unavailable" }, { status: 502 });
  }
}
