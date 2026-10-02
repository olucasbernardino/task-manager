import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const taskStatus = pgEnum("task_status", ["inbox", "todo", "doing", "done"]);
export const taskPriority = pgEnum("task_priority", ["low", "normal", "high", "urgent"]);
export const taskSource = pgEnum("task_source", ["manual", "email", "calendar", "telegram", "job"]);
export const jobStage = pgEnum("job_stage", ["found", "applied", "interview", "offer", "rejected"]);

const ts = (name: string) => timestamp(name, { withTimezone: true });

/** Single-user app: at most one row. Google tokens are AES-GCM encrypted. */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  googleSub: text("google_sub"),
  refreshTokenEnc: text("refresh_token_enc"),
  accessTokenEnc: text("access_token_enc"),
  accessTokenExpiresAt: ts("access_token_expires_at"),
  scopes: text("scopes"),
  gmailHistoryId: text("gmail_history_id"),
  calendarSyncToken: text("calendar_sync_token"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  archived: boolean("archived").notNull().default(false),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    notes: text("notes").notNull().default(""),
    status: taskStatus("status").notNull().default("inbox"),
    priority: taskPriority("priority").notNull().default("normal"),
    dueAt: ts("due_at"),
    /** true when dueAt carries a meaningful time (vs. date-only). */
    hasTime: boolean("has_time").notNull().default(false),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    source: taskSource("source").notNull().default("manual"),
    sourceRef: text("source_ref"),
    calendarEventId: text("calendar_event_id"),
    /** Manual ordering inside a Kanban column / list. */
    position: doublePrecision("position").notNull().default(0),
    completedAt: ts("completed_at"),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [index("tasks_status_idx").on(t.status), index("tasks_due_idx").on(t.dueAt), index("tasks_project_idx").on(t.projectId)],
);

export const jobApplications = pgTable("job_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  url: text("url"),
  stage: jobStage("stage").notNull().default("found"),
  score: integer("score"),
  emailThreadId: text("email_thread_id"),
  notes: text("notes").notNull().default(""),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const automationRuns = pgTable("automation_runs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ok: boolean("ok").notNull(),
  detail: jsonb("detail"),
  startedAt: ts("started_at").notNull().defaultNow(),
  finishedAt: ts("finished_at"),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
});

/** Single row, id = 1. */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  language: text("language").notNull().default("en"),
  theme: text("theme").notNull().default("dark"), // dark | light | system
  timezone: text("timezone").notNull().default("Europe/Madrid"),
  briefingTime: text("briefing_time").notNull().default("08:00"),
  cvText: text("cv_text").notNull().default(""),
  targetRoles: text("target_roles").notNull().default(""),
  aiEnabled: boolean("ai_enabled").notNull().default(false),
  telegramChatId: text("telegram_chat_id"),
});

export type Task = typeof tasks.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Settings = typeof settings.$inferSelect;
