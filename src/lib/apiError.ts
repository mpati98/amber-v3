import { NextRequest, NextResponse } from "next/server";

export function withApiError<
  Args extends unknown[],
  R
>(handler: (req: NextRequest, ...args: Args) => Promise<R>) {
  return async (req: NextRequest, ...args: Args) => {
    try {
      return await handler(req, ...args);
    } catch (err) {
      console.error(err);
      return NextResponse.json(
        { error: "Đã có lỗi xảy ra, thử lại sau." },
        { status: 500 }
      );
    }
  };
}
