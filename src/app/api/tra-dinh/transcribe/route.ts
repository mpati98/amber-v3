import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { aiUnavailableResponse, groqTranscribe } from "@/lib/groq";

// Gọi Groq (timeout 45s trong lib/groq.ts) — chừa thêm thời gian cho DB.
export const maxDuration = 60;

// Vercel giới hạn body request 4,5 MB — chặn trước với thông báo dễ hiểu.
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

export const POST = withAuth(async (req) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Thiếu file audio" }, { status: 400 });
  if (file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: "file_too_large", message: "Bản ghi âm quá lớn — tối đa 4 MB. Hãy ghi ngắn hơn rồi thử lại." },
      { status: 413 },
    );
  }

  try {
    const text = await groqTranscribe(file);
    return NextResponse.json({ text });
  } catch (err) {
    return aiUnavailableResponse(err);
  }
});
