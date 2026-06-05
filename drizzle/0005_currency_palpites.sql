DO $$ BEGIN
  CREATE TYPE "public"."currency_mode" AS ENUM('play', 'real');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."market_prediction_type" AS ENUM('champion', 'top_scorer', 'top_cards');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "currency_mode" "currency_mode" DEFAULT 'play' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "play_balance" integer DEFAULT 10000 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "real_balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "real_points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "predictions" ADD COLUMN IF NOT EXISTS "currency_mode" "currency_mode" DEFAULT 'play' NOT NULL;--> statement-breakpoint
ALTER TABLE "predictions" ADD COLUMN IF NOT EXISTS "stake_amount" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "market_predictions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "sport_id" uuid NOT NULL REFERENCES "sports"("id"),
  "series" varchar(8) NOT NULL,
  "currency_mode" "currency_mode" DEFAULT 'play' NOT NULL,
  "market_type" "market_prediction_type" NOT NULL,
  "athletics_id" uuid REFERENCES "athletics"("id"),
  "player_name" varchar(200),
  "stake_amount" integer DEFAULT 100 NOT NULL,
  "points_earned" integer,
  "is_scored" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "market_predictions_user_unique_idx" ON "market_predictions" ("user_id", "sport_id", "series", "market_type", "currency_mode");--> statement-breakpoint
DROP INDEX IF EXISTS "predictions_user_match_idx";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "predictions_user_match_currency_idx" ON "predictions" ("user_id", "match_id", "currency_mode");
