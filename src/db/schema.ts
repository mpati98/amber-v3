import { relations } from "drizzle-orm";
import { boolean, date, integer, numeric, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

// ============================================================
// Bảng (định nghĩa hết trước — mọi relations() dồn xuống cuối file
// để tránh lỗi TDZ khi 1 bảng tham chiếu tới bảng định nghĩa sau nó)
// ============================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 32 }),
  // "STANDARD" (dự án task thông thường) | "FINANCE" (tháng) | "LEARN" (khóa học) | ... mở rộng tự do
  type: varchar("type", { length: 32 }).notNull().default("STANDARD"),
  // Chu kỳ của dự án — dùng cho project có vòng đời rõ ràng (Finance: 1 tháng, Learn: ngày bắt đầu/kết thúc khóa)
  startDate: date("start_date"),
  endDate: date("end_date"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  // PREP (chuẩn bị) | WAITING (chờ) | IN_PROGRESS (đang thực thi) | DONE (hoàn thành)
  status: varchar("status", { length: 32 }).notNull().default("PREP"),
  importance: integer("importance").notNull(),
  urgency: integer("urgency").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(15),
  startDate: date("start_date"),
  dueDate: date("due_date"),
  prepLeadDays: integer("prep_lead_days"),
  // Chuỗi RRULE (RFC 5545) cho task lặp lại — null nghĩa là task chỉ xảy ra 1 lần.
  rrule: text("rrule"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const taskOccurrences = pgTable("task_occurrences", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  occurrenceDate: date("occurrence_date").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// ===== Quản lý tài chính cá nhân (dự án đặc biệt, type = "FINANCE") =====

export const financeAccounts = pgTable("finance_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(), // "Ví tiền mặt", "Vietcombank", "Momo"
  type: varchar("type", { length: 32 }).notNull(), // CASH | BANK | E_WALLET | CREDIT_CARD
  currentBalance: numeric("current_balance", { precision: 14, scale: 2 }).notNull().default("0"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const financeCategories = pgTable("finance_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 32 }), // emoji, ví dụ "🍜"
  kind: varchar("kind", { length: 16 }).notNull(), // INCOME | EXPENSE
});

export const financeTransactions = pgTable("finance_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }), // dự án tài chính (tháng) mà giao dịch này thuộc về
  accountId: uuid("account_id")
    .notNull()
    .references(() => financeAccounts.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => financeCategories.id, { onDelete: "set null" }),
  kind: varchar("kind", { length: 16 }).notNull(), // INCOME | EXPENSE
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(), // luôn dương, dấu quyết định bởi `kind`
  note: text("note"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const financeBudgets = pgTable("finance_budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }), // ngân sách gắn theo dự án tháng
  categoryId: uuid("category_id")
    .notNull()
    .references(() => financeCategories.id, { onDelete: "cascade" }),
  limitAmount: numeric("limit_amount", { precision: 14, scale: 2 }).notNull(),
});

// Chụp tổng số dư tại thời điểm bắt đầu 1 dự án tài chính (tháng) — dùng để vẽ
// biến động số dư qua từng tháng mà không cần dò lại lịch sử giao dịch mỗi lần.
export const financeBalanceSnapshots = pgTable("finance_balance_snapshots", {
  projectId: uuid("project_id")
    .primaryKey()
    .references(() => projects.id, { onDelete: "cascade" }),
  totalBalance: numeric("total_balance", { precision: 14, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

// ===== Học tập (dự án đặc biệt, type = "LEARN") — mỗi khóa học = 1 project =====

export const learnCourseDetails = pgTable("learn_course_details", {
  projectId: uuid("project_id")
    .primaryKey()
    .references(() => projects.id, { onDelete: "cascade" }),
  source: varchar("source", { length: 255 }), // "Udemy", "Coursera", "edX"...
  field: varchar("field", { length: 255 }), // lĩnh vực
  outcome: text("outcome"), // kết quả đạt được (chứng chỉ, điểm số, tổng kết)
  // PLANNED (dự định học) | IN_PROGRESS (đang học) | COMPLETED (đã xong)
  status: varchar("status", { length: 32 }).notNull().default("PLANNED"),
});

export const learnLessons = pgTable("learn_lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  studiedAt: date("studied_at"),
  durationMinutes: integer("duration_minutes"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// Relations — đặt sau CÙNG, sau khi mọi bảng đã được định nghĩa,
// để tránh lỗi "Cannot access 'X' before initialization" lúc runtime.
// ============================================================

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  tasks: many(tasks),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  tasks: many(tasks),
  financeTransactions: many(financeTransactions),
  financeBudgets: many(financeBudgets),
  financeBalanceSnapshot: one(financeBalanceSnapshots, {
    fields: [projects.id],
    references: [financeBalanceSnapshots.projectId],
  }),
  learnLessons: many(learnLessons),
  learnDetails: one(learnCourseDetails, { fields: [projects.id], references: [learnCourseDetails.projectId] }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  occurrences: many(taskOccurrences),
}));

export const taskOccurrencesRelations = relations(taskOccurrences, ({ one }) => ({
  task: one(tasks, { fields: [taskOccurrences.taskId], references: [tasks.id] }),
}));

export const financeAccountsRelations = relations(financeAccounts, ({ one, many }) => ({
  user: one(users, { fields: [financeAccounts.userId], references: [users.id] }),
  transactions: many(financeTransactions),
}));

export const financeCategoriesRelations = relations(financeCategories, ({ one, many }) => ({
  user: one(users, { fields: [financeCategories.userId], references: [users.id] }),
  transactions: many(financeTransactions),
  budgets: many(financeBudgets),
}));

export const financeTransactionsRelations = relations(financeTransactions, ({ one }) => ({
  user: one(users, { fields: [financeTransactions.userId], references: [users.id] }),
  project: one(projects, { fields: [financeTransactions.projectId], references: [projects.id] }),
  account: one(financeAccounts, { fields: [financeTransactions.accountId], references: [financeAccounts.id] }),
  category: one(financeCategories, { fields: [financeTransactions.categoryId], references: [financeCategories.id] }),
}));

export const financeBudgetsRelations = relations(financeBudgets, ({ one }) => ({
  user: one(users, { fields: [financeBudgets.userId], references: [users.id] }),
  project: one(projects, { fields: [financeBudgets.projectId], references: [projects.id] }),
  category: one(financeCategories, { fields: [financeBudgets.categoryId], references: [financeCategories.id] }),
}));

export const financeBalanceSnapshotsRelations = relations(financeBalanceSnapshots, ({ one }) => ({
  project: one(projects, { fields: [financeBalanceSnapshots.projectId], references: [projects.id] }),
}));

export const learnCourseDetailsRelations = relations(learnCourseDetails, ({ one, many }) => ({
  project: one(projects, { fields: [learnCourseDetails.projectId], references: [projects.id] }),
  lessons: many(learnLessons),
}));

export const learnLessonsRelations = relations(learnLessons, ({ one }) => ({
  project: one(projects, { fields: [learnLessons.projectId], references: [projects.id] }),
}));
