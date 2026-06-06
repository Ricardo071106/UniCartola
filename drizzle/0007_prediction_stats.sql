ALTER TABLE "predictions" ADD COLUMN IF NOT EXISTS "home_fouls" integer;
ALTER TABLE "predictions" ADD COLUMN IF NOT EXISTS "away_fouls" integer;
ALTER TABLE "predictions" ADD COLUMN IF NOT EXISTS "home_cards" integer;
ALTER TABLE "predictions" ADD COLUMN IF NOT EXISTS "away_cards" integer;
