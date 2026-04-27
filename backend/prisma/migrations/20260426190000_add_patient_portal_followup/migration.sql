-- CreateTable
CREATE TABLE "patient_portal_invitations" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "nutritionist_id" TEXT NOT NULL,
    "email" TEXT,
    "token_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "blocked_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "last_sent_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_portal_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_portal_check_ins" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "nutritionist_id" TEXT NOT NULL,
    "invitation_id" TEXT,
    "check_in_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DOUBLE PRECISION,
    "water_liters" DOUBLE PRECISION,
    "activity_minutes" INTEGER,
    "mood" TEXT,
    "energy" TEXT,
    "hunger" TEXT,
    "symptoms" JSONB NOT NULL DEFAULT '[]',
    "meals" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "photos" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_portal_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_portal_invitations_token_hash_key" ON "patient_portal_invitations"("token_hash");

-- CreateIndex
CREATE INDEX "patient_portal_invitations_patient_id_idx" ON "patient_portal_invitations"("patient_id");

-- CreateIndex
CREATE INDEX "patient_portal_invitations_nutritionist_id_idx" ON "patient_portal_invitations"("nutritionist_id");

-- CreateIndex
CREATE INDEX "patient_portal_invitations_expires_at_idx" ON "patient_portal_invitations"("expires_at");

-- CreateIndex
CREATE INDEX "patient_portal_check_ins_patient_id_idx" ON "patient_portal_check_ins"("patient_id");

-- CreateIndex
CREATE INDEX "patient_portal_check_ins_nutritionist_id_idx" ON "patient_portal_check_ins"("nutritionist_id");

-- CreateIndex
CREATE INDEX "patient_portal_check_ins_check_in_date_idx" ON "patient_portal_check_ins"("check_in_date");

-- AddForeignKey
ALTER TABLE "patient_portal_invitations" ADD CONSTRAINT "patient_portal_invitations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_portal_invitations" ADD CONSTRAINT "patient_portal_invitations_nutritionist_id_fkey" FOREIGN KEY ("nutritionist_id") REFERENCES "nutritionists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_portal_check_ins" ADD CONSTRAINT "patient_portal_check_ins_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_portal_check_ins" ADD CONSTRAINT "patient_portal_check_ins_nutritionist_id_fkey" FOREIGN KEY ("nutritionist_id") REFERENCES "nutritionists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_portal_check_ins" ADD CONSTRAINT "patient_portal_check_ins_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "patient_portal_invitations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "patient_portal_entries" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "nutritionist_id" TEXT NOT NULL,
    "invitation_id" TEXT,
    "reply_to_id" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'QUESTION',
    "body" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_portal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_portal_entries_patient_id_idx" ON "patient_portal_entries"("patient_id");

-- CreateIndex
CREATE INDEX "patient_portal_entries_nutritionist_id_idx" ON "patient_portal_entries"("nutritionist_id");

-- CreateIndex
CREATE INDEX "patient_portal_entries_kind_idx" ON "patient_portal_entries"("kind");

-- CreateIndex
CREATE INDEX "patient_portal_entries_reply_to_id_idx" ON "patient_portal_entries"("reply_to_id");

-- AddForeignKey
ALTER TABLE "patient_portal_entries" ADD CONSTRAINT "patient_portal_entries_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_portal_entries" ADD CONSTRAINT "patient_portal_entries_nutritionist_id_fkey" FOREIGN KEY ("nutritionist_id") REFERENCES "nutritionists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_portal_entries" ADD CONSTRAINT "patient_portal_entries_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "patient_portal_invitations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_portal_entries" ADD CONSTRAINT "patient_portal_entries_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "patient_portal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
