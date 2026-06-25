-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- AlterTable
ALTER TABLE "nutritionists" ADD COLUMN "public_slug" TEXT;

-- Backfill existing slugs from current profile data.
UPDATE "nutritionists"
SET "public_slug" = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      SUBSTRING(unaccent("full_name") FROM 1 FOR 30),
      '[^a-zA-Z0-9\s-]',
      '',
      'g'
    ),
    '\\s+',
    '-',
    'g'
  )
) || '-' || SUBSTRING("id"::text FROM 1 FOR 8)
WHERE "public_slug" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "nutritionists_public_slug_key" ON "nutritionists"("public_slug");
