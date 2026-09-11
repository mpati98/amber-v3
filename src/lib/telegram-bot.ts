import { Bot } from "grammy";

// Stub — chưa có lệnh/nghiệp vụ nào được gắn. Cần đặt TELEGRAM_BOT_TOKEN
// (và TELEGRAM_WEBHOOK_SECRET cho route webhook) trước khi bot dùng được thật.
export const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || "unset");
