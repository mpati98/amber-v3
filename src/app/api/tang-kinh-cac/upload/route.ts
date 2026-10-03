import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { sanitizeFileName } from "@/lib/filename";

// Vercel giới hạn body request 4,5 MB — chặn trước với thông báo dễ hiểu.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const POST = withAuth(async (req) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "file_too_large", message: "Tệp quá lớn — tối đa 4 MB. Hãy nén hoặc chọn tệp nhỏ hơn." },
      { status: 413 },
    );
  }

  const blob = await put(`tang-kinh-cac/${Date.now()}-${sanitizeFileName(file.name)}`, file, { access: "private" });
  return NextResponse.json({ url: `/api/tang-kinh-cac/blob/${blob.pathname}` });
});
