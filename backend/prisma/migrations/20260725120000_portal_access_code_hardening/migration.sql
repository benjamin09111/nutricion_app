ALTER TABLE "patient_portal_invitations"
  ADD COLUMN "access_code_hash" TEXT,
  ADD COLUMN "access_code_set_at" TIMESTAMP(3),
  ADD COLUMN "failed_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "locked_until" TIMESTAMP(3);

CREATE INDEX "patient_portal_invitations_locked_until_idx"
  ON "patient_portal_invitations" ("locked_until");
