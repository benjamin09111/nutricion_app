DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'consultations'
      AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'consultations'
      AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "consultations" RENAME COLUMN "createdAt" TO "created_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'consultations'
      AND column_name = 'updatedAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'consultations'
      AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE "consultations" RENAME COLUMN "updatedAt" TO "updated_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patient_portal_check_ins'
      AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patient_portal_check_ins'
      AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "patient_portal_check_ins" RENAME COLUMN "createdAt" TO "created_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patient_portal_check_ins'
      AND column_name = 'updatedAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patient_portal_check_ins'
      AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE "patient_portal_check_ins" RENAME COLUMN "updatedAt" TO "updated_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patient_portal_entries'
      AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patient_portal_entries'
      AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "patient_portal_entries" RENAME COLUMN "createdAt" TO "created_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patient_portal_entries'
      AND column_name = 'updatedAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patient_portal_entries'
      AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE "patient_portal_entries" RENAME COLUMN "updatedAt" TO "updated_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ingredients'
      AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ingredients'
      AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "ingredients" RENAME COLUMN "createdAt" TO "created_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ingredients'
      AND column_name = 'updatedAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ingredients'
      AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE "ingredients" RENAME COLUMN "updatedAt" TO "updated_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'metric_definitions'
      AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'metric_definitions'
      AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "metric_definitions" RENAME COLUMN "createdAt" TO "created_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'metric_definitions'
      AND column_name = 'updatedAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'metric_definitions'
      AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE "metric_definitions" RENAME COLUMN "updatedAt" TO "updated_at"';
  END IF;
END $$;
