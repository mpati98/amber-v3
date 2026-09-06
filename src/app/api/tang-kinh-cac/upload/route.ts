import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { withApiError } from "@/lib/apiError";

export const POST = withApiError(async (req: NextRequest) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Thiếu file" }, { status: 400 });

  const blob = await put(`tang-kinh-cac/${Date.now()}-${file.name}`, file, { access: "public" });
  return NextResponse.json({ url: blob.url });
});
