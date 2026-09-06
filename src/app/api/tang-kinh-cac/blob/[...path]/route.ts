import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { withApiError } from "@/lib/apiError";

export const GET = withApiError(async (_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) => {
  const { path } = await params;
  const pathname = path.join("/");

  const result = await get(pathname, { access: "private" });
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
});
