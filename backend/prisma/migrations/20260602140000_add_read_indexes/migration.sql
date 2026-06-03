-- CreateIndex
CREATE INDEX "accounts_role_created_at_idx" ON "accounts"("role", "created_at");

-- CreateIndex
CREATE INDEX "nutritionists_full_name_idx" ON "nutritionists"("full_name");

-- CreateIndex
CREATE INDEX "patient_portal_invitations_email_status_expires_at_idx" ON "patient_portal_invitations"("email", "status", "expires_at");

-- CreateIndex
CREATE INDEX "patient_portal_invitations_patient_nutritionist_created_at_idx" ON "patient_portal_invitations"("patient_id", "nutritionist_id", "created_at");

-- CreateIndex
CREATE INDEX "patient_portal_entries_patient_nutritionist_created_at_idx" ON "patient_portal_entries"("patient_id", "nutritionist_id", "created_at");

-- CreateIndex
CREATE INDEX "appointments_patient_status_start_time_idx" ON "appointments"("patient_id", "status", "start_time");
