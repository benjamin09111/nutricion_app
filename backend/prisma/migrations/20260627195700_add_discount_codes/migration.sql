-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'DiscountCodeType'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "DiscountCodeType" AS ENUM ('NUTRI', 'BETA');
  END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "discount_codes" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "type" "DiscountCodeType" NOT NULL,
  "discount_percent" INTEGER NOT NULL,
  "is_used" BOOLEAN NOT NULL DEFAULT false,
  "used_by_account_id" TEXT,
  "used_at" TIMESTAMPTZ(6),
  "created_by_admin_id" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "discount_codes_code_key" ON "discount_codes"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "discount_codes_created_by_admin_id_idx" ON "discount_codes"("created_by_admin_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'discount_codes_used_by_account_id_fkey'
  ) THEN
    ALTER TABLE "discount_codes"
      ADD CONSTRAINT "discount_codes_used_by_account_id_fkey"
      FOREIGN KEY ("used_by_account_id") REFERENCES "accounts"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'discount_codes_created_by_admin_id_fkey'
  ) THEN
    ALTER TABLE "discount_codes"
      ADD CONSTRAINT "discount_codes_created_by_admin_id_fkey"
      FOREIGN KEY ("created_by_admin_id") REFERENCES "accounts"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
