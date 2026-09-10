// scripts/create-admin.ts
import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { users } from "../src/db/schema";

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Dùng: npx tsx scripts/create-admin.ts <email> <password>");
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  const user = existing
    ? (await db.update(users).set({ passwordHash }).where(eq(users.email, email)).returning())[0]
    : (await db.insert(users).values({ email, passwordHash }).returning())[0];

  console.log("Đã tạo/cập nhật user:", user.email);
}

main().then(() => process.exit(0));
