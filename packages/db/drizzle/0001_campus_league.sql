-- Campus League schema additions

ALTER TYPE "leaderboard_scope" ADD VALUE IF NOT EXISTS 'weekly';
ALTER TYPE "leaderboard_scope" ADD VALUE IF NOT EXISTS 'historical';

CREATE TABLE IF NOT EXISTS "posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "user_profiles"("id"),
  "content" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "post_id" uuid NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "user_profiles"("id"),
  "content" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "post_reactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "post_id" uuid NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "user_profiles"("id"),
  "emoji" varchar(8) DEFAULT '🔥' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "user_profiles"("id"),
  "type" varchar(64) NOT NULL,
  "title" varchar(255) NOT NULL,
  "body" text NOT NULL,
  "read" boolean DEFAULT false NOT NULL,
  "metadata" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "match_stats" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "match_id" uuid NOT NULL REFERENCES "matches"("id") ON DELETE CASCADE,
  "goals" jsonb,
  "assists" jsonb,
  "cards" jsonb,
  "top_scorers" jsonb,
  "extra" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "matches_import_queue" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source" varchar(64) NOT NULL,
  "external_key" varchar(255) NOT NULL,
  "payload" jsonb NOT NULL,
  "status" varchar(32) DEFAULT 'pending' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "last_error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "processed_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "statistics_import_queue" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source" varchar(64) NOT NULL,
  "match_external_key" varchar(255) NOT NULL,
  "payload" jsonb NOT NULL,
  "status" varchar(32) DEFAULT 'pending' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "last_error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "processed_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "posts_user_idx" ON "posts" ("user_id");
CREATE INDEX IF NOT EXISTS "posts_created_idx" ON "posts" ("created_at");
CREATE INDEX IF NOT EXISTS "comments_post_idx" ON "comments" ("post_id");
CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "match_stats_match_idx" ON "match_stats" ("match_id");
CREATE INDEX IF NOT EXISTS "matches_import_queue_status_idx" ON "matches_import_queue" ("status");
CREATE INDEX IF NOT EXISTS "statistics_import_queue_status_idx" ON "statistics_import_queue" ("status");
