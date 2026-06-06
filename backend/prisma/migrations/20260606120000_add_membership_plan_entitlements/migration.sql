-- AlterTable
ALTER TABLE "membership_plans"
ADD COLUMN "entitlements" JSONB NOT NULL DEFAULT '{}'::jsonb;
