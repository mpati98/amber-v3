import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Serverless (Vercel): mỗi instance giữ pool nhỏ, đóng kết nối rảnh sớm.
// prepare:false bắt buộc khi đi qua pooler (PgBouncer transaction mode), vô hại
// khi kết nối thẳng.
const client = postgres(process.env.DATABASE_URL!, { max: 5, prepare: false, idle_timeout: 20 });

export const db = drizzle(client, { schema });
