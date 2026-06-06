ALTER TABLE "market_predictions" ADD COLUMN IF NOT EXISTS "is_locked" boolean DEFAULT false NOT NULL;
ALTER TABLE "market_predictions" ADD COLUMN IF NOT EXISTS "lock_reason" varchar(32);
