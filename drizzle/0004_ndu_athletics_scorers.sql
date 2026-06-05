ALTER TABLE "athletics" ADD COLUMN IF NOT EXISTS "ndu_athletic_id" integer;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "athletics_ndu_id_idx" ON "athletics" ("ndu_athletic_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ndu_scorer_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sport_slug" varchar(20) NOT NULL,
	"series" varchar(2) NOT NULL,
	"player_name" varchar(200) NOT NULL,
	"athletic_ndu_id" integer,
	"team_name" varchar(200),
	"logo_url" text,
	"total" integer NOT NULL,
	"stat_type" varchar(10) NOT NULL,
	"season_year" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ndu_scorer_stats_unique_idx" ON "ndu_scorer_stats" ("sport_slug","series","player_name","stat_type","season_year");
