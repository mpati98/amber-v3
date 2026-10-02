import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { z } from "zod";
import { groqSpeak } from "@/lib/groq";

const speakSchema = z.object({
  text: z.string().min(1).max(2000),
});

export const POST = withAuth(async (req) => {
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
});
