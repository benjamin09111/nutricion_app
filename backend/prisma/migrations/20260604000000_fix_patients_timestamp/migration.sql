-- Rename createdAt -> created_at and updatedAt -> updated_at for patients table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "patients" RENAME COLUMN "createdAt" TO "created_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'updatedAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE "patients" RENAME COLUMN "updatedAt" TO "updated_at"';
  END IF;
END $$;