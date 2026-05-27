ALTER TABLE "cases" ADD COLUMN "completion_score_threshold" integer DEFAULT 40 NOT NULL;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "completion_clues_threshold" integer DEFAULT 3 NOT NULL;