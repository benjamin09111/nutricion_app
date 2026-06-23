DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'appointments'
      AND column_name = 'metadata'
  ) THEN
    EXECUTE 'ALTER TABLE "appointments" ADD COLUMN "metadata" JSONB DEFAULT ''{}''::jsonb';
  END IF;
END $$;
