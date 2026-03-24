-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "nutritionist_id" TEXT NOT NULL,
    "patient_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'CLINICAL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "active_diet_creation_id" TEXT,
    "active_recipe_creation_id" TEXT,
    "active_cart_creation_id" TEXT,
    "active_deliverable_creation_id" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_nutritionist_id_idx" ON "projects"("nutritionist_id");

-- CreateIndex
CREATE INDEX "projects_patient_id_idx" ON "projects"("patient_id");

-- AddForeignKey
ALTER TABLE "projects"
ADD CONSTRAINT "projects_nutritionist_id_fkey"
FOREIGN KEY ("nutritionist_id") REFERENCES "nutritionists"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects"
ADD CONSTRAINT "projects_patient_id_fkey"
FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects"
ADD CONSTRAINT "projects_active_diet_creation_id_fkey"
FOREIGN KEY ("active_diet_creation_id") REFERENCES "creations"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects"
ADD CONSTRAINT "projects_active_recipe_creation_id_fkey"
FOREIGN KEY ("active_recipe_creation_id") REFERENCES "creations"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects"
ADD CONSTRAINT "projects_active_cart_creation_id_fkey"
FOREIGN KEY ("active_cart_creation_id") REFERENCES "creations"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects"
ADD CONSTRAINT "projects_active_deliverable_creation_id_fkey"
FOREIGN KEY ("active_deliverable_creation_id") REFERENCES "creations"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
