import { webhookCallback } from "grammy";
import { bot } from "@/lib/telegram-bot";
import { NextRequest, NextResponse } from "next/server";

const handleUpdate = webhookCallback(bot, "std/http");

export async function POST(req: NextRequest) {
  // Telegram gửi kèm header này khi bạn set secret_token lúc đăng ký webhook (setWebhook).
  // Chặn request giả mạo trực tiếp vào endpoint public.
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return handleUpdate(req);
}
