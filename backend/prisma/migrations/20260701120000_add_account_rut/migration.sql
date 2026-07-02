-- AddColumn
ALTER TABLE "accounts"
ADD COLUMN IF NOT EXISTS "rut" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_rut_key" ON "accounts"("rut");
