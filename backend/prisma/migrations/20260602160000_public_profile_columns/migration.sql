-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- AlterTable
ALTER TABLE "nutritionists"
  ADD COLUMN "public_profile_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "headline" TEXT,
  ADD COLUMN "bio" TEXT,
  ADD COLUMN "consultation_mode" TEXT NOT NULL DEFAULT 'online',
  ADD COLUMN "location" TEXT;

-- Backfill public profile fields from settings JSON.
UPDATE "nutritionists"
SET
  "public_profile_enabled" = COALESCE(("settings"->>'publicProfileEnabled')::boolean, false),
  "headline" = NULLIF("settings"->>'headline', ''),
  "bio" = NULLIF("settings"->>'bio', ''),
  "consultation_mode" = COALESCE(NULLIF("settings"->>'consultationMode', ''), 'online'),
  "location" = NULLIF("settings"->>'location', '')
WHERE "settings" IS NOT NULL;

-- CreateIndex
CREATE INDEX "nutritionists_public_profile_enabled_full_name_idx" ON "nutritionists"("public_profile_enabled", "full_name");

-- CreateIndex
CREATE INDEX "nutritionists_public_profile_enabled_consultation_mode_idx" ON "nutritionists"("public_profile_enabled", "consultation_mode");

-- CreateIndex
CREATE INDEX "nutritionists_full_name_trgm_idx" ON "nutritionists" USING gin ("full_name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "nutritionists_specialty_trgm_idx" ON "nutritionists" USING gin ("specialty" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "nutritionists_headline_trgm_idx" ON "nutritionists" USING gin ("headline" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "nutritionists_bio_trgm_idx" ON "nutritionists" USING gin ("bio" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "nutritionists_location_trgm_idx" ON "nutritionists" USING gin ("location" gin_trgm_ops);
