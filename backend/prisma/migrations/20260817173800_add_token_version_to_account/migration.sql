-- AlterTable: Add token_version and TOTP fields to accounts
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "token_version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "totp_secret" TEXT;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "totp_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "totp_recovery_codes" TEXT[] DEFAULT ARRAY[]::TEXT[];
