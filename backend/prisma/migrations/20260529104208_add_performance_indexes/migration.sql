-- CreateIndex
CREATE INDEX "ingredients_nutritionist_id_idx" ON "ingredients"("nutritionist_id");

-- CreateIndex
CREATE INDEX "patients_nutritionist_id_idx" ON "patients"("nutritionist_id");

-- CreateIndex
CREATE INDEX "recipes_nutritionist_id_idx" ON "recipes"("nutritionist_id");
