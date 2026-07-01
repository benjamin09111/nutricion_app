-- CreateTable
CREATE TABLE "patient_intake_links" (
    "id" TEXT NOT NULL,
    "nutritionist_id" TEXT NOT NULL,
    "token_version" INTEGER NOT NULL DEFAULT 1,
    "token_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_intake_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_intake_submissions" (
    "id" TEXT NOT NULL,
    "link_id" TEXT NOT NULL,
    "nutritionist_id" TEXT NOT NULL,
    "patient_id" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "reject_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_intake_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_intake_links_nutritionist_id_key" ON "patient_intake_links"("nutritionist_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_intake_links_token_hash_key" ON "patient_intake_links"("token_hash");

-- CreateIndex
CREATE INDEX "patient_intake_links_nutritionist_id_idx" ON "patient_intake_links"("nutritionist_id");

-- CreateIndex
CREATE INDEX "patient_intake_links_token_hash_idx" ON "patient_intake_links"("token_hash");

-- CreateIndex
CREATE INDEX "patient_intake_submissions_link_id_idx" ON "patient_intake_submissions"("link_id");

-- CreateIndex
CREATE INDEX "patient_intake_submissions_status_idx" ON "patient_intake_submissions"("status");

-- CreateIndex
CREATE INDEX "patient_intake_submissions_nutritionist_id_idx" ON "patient_intake_submissions"("nutritionist_id");

-- AddForeignKey
ALTER TABLE "patient_intake_links"
ADD CONSTRAINT "patient_intake_links_nutritionist_id_fkey"
FOREIGN KEY ("nutritionist_id") REFERENCES "nutritionists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_intake_submissions"
ADD CONSTRAINT "patient_intake_submissions_link_id_fkey"
FOREIGN KEY ("link_id") REFERENCES "patient_intake_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_intake_submissions"
ADD CONSTRAINT "patient_intake_submissions_patient_id_fkey"
FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_intake_submissions"
ADD CONSTRAINT "patient_intake_submissions_nutritionist_id_fkey"
FOREIGN KEY ("nutritionist_id") REFERENCES "nutritionists"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
