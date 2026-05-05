-- Baseline migration. The schema below already exists in prod (created via
-- earlier migrations 0000_amused_lifeguard / 0001_third_zodiak / 0002_add_trips,
-- which were squashed when drizzle's snapshots fell out of sync). This file is
-- written idempotently so it serves as the new history starting point: it
-- no-ops against the live DB on first migrate, then drizzle records its hash
-- in __drizzle_migrations so future migrations diff cleanly off this baseline.
CREATE TABLE IF NOT EXISTS "chat_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_session_id" text NOT NULL,
	"role" text NOT NULL,
	"parts" jsonb NOT NULL,
	"metadata" jsonb,
	"order_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session_evaluations" (
	"chat_session_id" text PRIMARY KEY NOT NULL,
	"goal_met" integer NOT NULL,
	"capability_gap" text,
	"friction" text,
	"notes" text,
	"evaluated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_state" (
	"id" text PRIMARY KEY NOT NULL,
	"last_extraction_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trips" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text DEFAULT 'Untitled trip' NOT NULL,
	"destination" text,
	"start_date" text,
	"end_date" text,
	"budget_cents" integer,
	"status" text DEFAULT 'planning' NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"chat_session_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_session_id_chat_sessions_id_fk" FOREIGN KEY ("chat_session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "session_evaluations" ADD CONSTRAINT "session_evaluations_chat_session_id_chat_sessions_id_fk" FOREIGN KEY ("chat_session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "trips" ADD CONSTRAINT "trips_chat_session_id_chat_sessions_id_fk" FOREIGN KEY ("chat_session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
