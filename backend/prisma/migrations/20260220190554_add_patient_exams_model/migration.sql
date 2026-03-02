-- CreateTable
CREATE TABLE "patient_exams" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_url" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_exams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_exams_patient_id_idx" ON "patient_exams"("patient_id");

-- AddForeignKey
ALTER TABLE "patient_exams" ADD CONSTRAINT "patient_exams_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
