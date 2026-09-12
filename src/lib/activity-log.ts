import { db } from "@/db";
import { activityLogs } from "@/db/schema";

export async function logActivity(params: {
  userId: string;
  source: "DU_AN" | "FINANCE" | "LEARN" | "TRA_DINH" | "KIEU_LAU";
  action: string;
  title: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(activityLogs).values({
      userId: params.userId,
      source: params.source,
      action: params.action,
      title: params.title,
      metadata: params.metadata ?? null,
    });
  } catch {
    // Ghi log không bao giờ được làm hỏng luồng chính — nuốt lỗi ở đây.
  }
}
