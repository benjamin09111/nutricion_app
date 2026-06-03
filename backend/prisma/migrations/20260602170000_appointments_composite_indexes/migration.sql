-- CreateIndex
CREATE INDEX "appointments_calendar_id_status_start_time_idx" ON "appointments"("calendar_id", "status", "start_time");

-- CreateIndex
CREATE INDEX "appointments_calendar_id_status_created_at_idx" ON "appointments"("calendar_id", "status", "created_at");
