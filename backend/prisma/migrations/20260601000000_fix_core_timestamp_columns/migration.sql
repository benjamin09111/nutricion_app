DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "accounts" RENAME COLUMN "createdAt" TO "created_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'updatedAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE "accounts" RENAME COLUMN "updatedAt" TO "updated_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nutritionists' AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nutritionists' AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "nutritionists" RENAME COLUMN "createdAt" TO "created_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nutritionists' AND column_name = 'updatedAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nutritionists' AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE "nutritionists" RENAME COLUMN "updatedAt" TO "updated_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'membership_plans' AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'membership_plans' AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "membership_plans" RENAME COLUMN "createdAt" TO "created_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'membership_plans' AND column_name = 'updatedAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'membership_plans' AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE "membership_plans" RENAME COLUMN "updatedAt" TO "updated_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "subscriptions" RENAME COLUMN "createdAt" TO "created_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'updatedAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE "subscriptions" RENAME COLUMN "updatedAt" TO "updated_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_portal_invitations' AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_portal_invitations' AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "patient_portal_invitations" RENAME COLUMN "createdAt" TO "created_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_portal_invitations' AND column_name = 'updatedAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_portal_invitations' AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE "patient_portal_invitations" RENAME COLUMN "updatedAt" TO "updated_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_portal_entries' AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_portal_entries' AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "patient_portal_entries" RENAME COLUMN "createdAt" TO "created_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_portal_entries' AND column_name = 'updatedAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_portal_entries' AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE "patient_portal_entries" RENAME COLUMN "updatedAt" TO "updated_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "payments" RENAME COLUMN "createdAt" TO "created_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'updatedAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE "payments" RENAME COLUMN "updatedAt" TO "updated_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registration_requests' AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registration_requests' AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "registration_requests" RENAME COLUMN "createdAt" TO "created_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registration_requests' AND column_name = 'updatedAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registration_requests' AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE "registration_requests" RENAME COLUMN "updatedAt" TO "updated_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_requests' AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_requests' AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "support_requests" RENAME COLUMN "createdAt" TO "created_at"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_requests' AND column_name = 'updatedAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_requests' AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE "support_requests" RENAME COLUMN "updatedAt" TO "updated_at"';
  END IF;
END $$;
