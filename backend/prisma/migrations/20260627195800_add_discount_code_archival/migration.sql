-- Add archival columns to discount_codes
ALTER TABLE "discount_codes"
ADD COLUMN IF NOT EXISTS "archived_at" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS "archived_by_admin_id" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "discount_codes_archived_at_idx" ON "discount_codes"("archived_at");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'discount_codes_archived_by_admin_id_fkey'
  ) THEN
    ALTER TABLE "discount_codes"
      ADD CONSTRAINT "discount_codes_archived_by_admin_id_fkey"
      FOREIGN KEY ("archived_by_admin_id") REFERENCES "accounts"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
