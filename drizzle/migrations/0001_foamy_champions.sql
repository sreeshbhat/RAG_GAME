CREATE TABLE IF NOT EXISTS "student_suspect_interrogation_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	"suspect_name" varchar(120) NOT NULL,
	"pressure_level" integer DEFAULT 0 NOT NULL,
	"contradictions_found" integer DEFAULT 0 NOT NULL,
	"revealed_facts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_timeline_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	"event_order" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"submitted" boolean DEFAULT false NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "suspect_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"suspect_name" varchar(120) NOT NULL,
	"personality" text NOT NULL,
	"truthfulness" integer NOT NULL,
	"background" text NOT NULL,
	"hidden_facts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"emotional_triggers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "timeline_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"timestamp" varchar(64) NOT NULL,
	"description" text NOT NULL,
	"evidence_id" uuid NOT NULL,
	"critical" boolean DEFAULT false NOT NULL,
	"order_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "suspect_name" varchar(120);--> statement-breakpoint
ALTER TABLE "student_case_progress" ADD COLUMN "hints_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "student_case_progress" ADD COLUMN "timeline_accuracy" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "student_case_progress" ADD COLUMN "contradictions_found" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "student_case_progress" ADD COLUMN "avg_pressure_reached" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "student_suspect_interrogation_unique" ON "student_suspect_interrogation_state" USING btree ("student_id","case_id","suspect_name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "student_timeline_unique" ON "student_timeline_progress" USING btree ("student_id","case_id");