ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "updated_at" timestamp;--> statement-breakpoint
UPDATE "matches" SET "updated_at" = COALESCE("created_at", now()) WHERE "updated_at" IS NULL;--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "matches" ALTER COLUMN "updated_at" SET NOT NULL;
EXCEPTION WHEN others THEN null;
END $$;
