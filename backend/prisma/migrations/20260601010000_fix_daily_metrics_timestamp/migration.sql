DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_metrics' AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_metrics' AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "daily_metrics" RENAME COLUMN "createdAt" TO "created_at"';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_metrics' AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "daily_metrics" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP';
  END IF;
END $$;
