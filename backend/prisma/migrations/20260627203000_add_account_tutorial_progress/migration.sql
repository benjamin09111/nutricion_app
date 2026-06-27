-- Add tutorial progress to accounts
ALTER TABLE "accounts"
ADD COLUMN IF NOT EXISTS "tutorial_progress" JSONB NOT NULL DEFAULT '{}'::jsonb;
