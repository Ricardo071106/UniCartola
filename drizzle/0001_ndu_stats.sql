ALTER TABLE "athletics" ADD COLUMN IF NOT EXISTS "ndu_alias" varchar(255);--> statement-breakpoint
ALTER TABLE "athletics" ADD COLUMN IF NOT EXISTS "normalized_name" varchar(255);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "athletics_normalized_idx" ON "athletics" ("normalized_name");--> statement-breakpoint
ALTER TABLE "sports" ADD COLUMN IF NOT EXISTS "ndu_url" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "home_athletics_id" uuid;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "away_athletics_id" uuid;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "series" varchar(8);--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "group_name" varchar(8);--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "home_team_name" varchar(255);--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "away_team_name" varchar(255);--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "external_key" varchar(255);--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "matches_series_idx" ON "matches" ("series");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "matches_external_key_idx" ON "matches" ("external_key");--> statement-breakpoint
ALTER TABLE "match_stats" ADD COLUMN IF NOT EXISTS "goal_scorers" jsonb;--> statement-breakpoint
ALTER TABLE "match_stats" ADD COLUMN IF NOT EXISTS "top_scorers" jsonb;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"normalized_name" varchar(255) NOT NULL,
	"university_id" uuid,
	"athletics_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "players_normalized_idx" ON "players" ("normalized_name");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scrape_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" varchar(50) DEFAULT 'ndu' NOT NULL,
	"status" varchar(20) DEFAULT 'running' NOT NULL,
	"matches_created" integer DEFAULT 0,
	"matches_updated" integer DEFAULT 0,
	"errors" jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_mapping_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raw_name" varchar(255) NOT NULL,
	"suggested_athletics_id" uuid,
	"needs_review" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_home_athletics_id_athletics_id_fk" FOREIGN KEY ("home_athletics_id") REFERENCES "public"."athletics"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_away_athletics_id_athletics_id_fk" FOREIGN KEY ("away_athletics_id") REFERENCES "public"."athletics"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "players" ADD CONSTRAINT "players_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "players" ADD CONSTRAINT "players_athletics_id_athletics_id_fk" FOREIGN KEY ("athletics_id") REFERENCES "public"."athletics"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_mapping_queue" ADD CONSTRAINT "team_mapping_queue_suggested_athletics_id_athletics_id_fk" FOREIGN KEY ("suggested_athletics_id") REFERENCES "public"."athletics"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
