-- Create enum type for discount code status
DO $$
BEGIN
  CREATE TYPE "DiscountCodeStatus" AS ENUM ('ACTIVE', 'SHARED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add status to discount codes
ALTER TABLE "discount_codes"
ADD COLUMN IF NOT EXISTS "status" "DiscountCodeStatus" NOT NULL DEFAULT 'ACTIVE';

-- Backfill existing rows based on current flags
UPDATE "discount_codes"
SET "status" = CASE
  WHEN "is_used" = true THEN 'EXPIRED'::"DiscountCodeStatus"
  ELSE 'ACTIVE'::"DiscountCodeStatus"
END;
