// scripts/create-admin.ts
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Dùng: npx tsx scripts/create-admin.ts <email> <password>");
    process.exit(1);
  }
  const passwordHash = await hashPassword(password);
  const admin = await prisma.adminAccount.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });
  console.log("Đã tạo/cập nhật admin:", admin.email);
}

main().then(() => process.exit(0));
