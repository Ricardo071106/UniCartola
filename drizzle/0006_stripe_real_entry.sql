ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "real_entry_paid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "real_entry_paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_customer_id" varchar(255);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_metadata" (
  "key" varchar(64) PRIMARY KEY NOT NULL,
  "value" text NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
