CREATE TABLE "clinical_records" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "vital_history" JSONB DEFAULT '{}'::jsonb,
    "gyneco_obstetric" JSONB DEFAULT '{}'::jsonb,
    "nutritional_anamnesis" JSONB DEFAULT '{}'::jsonb,
    "anthropometry" JSONB DEFAULT '{}'::jsonb,
    "data_sources" JSONB DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "clinical_records_patient_id_key" ON "clinical_records"("patient_id");

ALTER TABLE "clinical_records"
ADD CONSTRAINT "clinical_records_patient_id_fkey"
FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
