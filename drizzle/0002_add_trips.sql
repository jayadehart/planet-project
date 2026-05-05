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
	ALTER TABLE "trips" ADD CONSTRAINT "trips_chat_session_id_chat_sessions_id_fk" FOREIGN KEY ("chat_session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
