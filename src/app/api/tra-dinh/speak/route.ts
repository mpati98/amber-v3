import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { groqSpeak } from "@/lib/groq";

const speakSchema = z.object({
  text: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = speakSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { audio, contentType } = await groqSpeak(parsed.data.text);
    return new NextResponse(new Uint8Array(audio), { headers: { "Content-Type": contentType } });
  } catch {
    return NextResponse.json({ error: "ai_unavailable" }, { status: 502 });
  }
}
