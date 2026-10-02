CREATE TYPE "public"."job_stage" AS ENUM('found', 'applied', 'interview', 'offer', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_source" AS ENUM('manual', 'email', 'calendar', 'telegram', 'job');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('inbox', 'todo', 'doing', 'done');--> statement-breakpoint
CREATE TABLE "automation_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"ok" boolean NOT NULL,
	"detail" jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company" text NOT NULL,
	"role" text NOT NULL,
	"url" text,
	"stage" "job_stage" DEFAULT 'found' NOT NULL,
	"score" integer,
	"email_thread_id" text,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#6366f1' NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"theme" text DEFAULT 'dark' NOT NULL,
	"timezone" text DEFAULT 'Europe/Madrid' NOT NULL,
	"briefing_time" text DEFAULT '08:00' NOT NULL,
	"cv_text" text DEFAULT '' NOT NULL,
	"target_roles" text DEFAULT '' NOT NULL,
	"ai_enabled" boolean DEFAULT false NOT NULL,
	"telegram_chat_id" text
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"status" "task_status" DEFAULT 'inbox' NOT NULL,
	"priority" "task_priority" DEFAULT 'normal' NOT NULL,
	"due_at" timestamp with time zone,
	"has_time" boolean DEFAULT false NOT NULL,
	"project_id" uuid,
	"source" "task_source" DEFAULT 'manual' NOT NULL,
	"source_ref" text,
	"calendar_event_id" text,
	"position" double precision DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"google_sub" text,
	"refresh_token_enc" text,
	"access_token_enc" text,
	"access_token_expires_at" timestamp with time zone,
	"scopes" text,
	"gmail_history_id" text,
	"calendar_sync_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_due_idx" ON "tasks" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "tasks_project_idx" ON "tasks" USING btree ("project_id");