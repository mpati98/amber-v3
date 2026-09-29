import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";

export const POST = withAuth(async (req) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Thiếu file" }, { status: 400 });

  const blob = await put(`tang-kinh-cac/${Date.now()}-${file.name}`, file, { access: "private" });
  return NextResponse.json({ url: `/api/tang-kinh-cac/blob/${blob.pathname}` });
});
