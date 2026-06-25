-- Fix legacy subscription_events timestamp column shape.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'subscription_events'
      AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'subscription_events'
      AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "subscription_events" RENAME COLUMN "createdAt" TO "created_at"';
  ELSIF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'subscription_events'
      AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "subscription_events" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP';
  END IF;
END $$;

ALTER TABLE "subscription_events"
  ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
