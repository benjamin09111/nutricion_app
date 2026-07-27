CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "actor_id" TEXT,
  "actor_type" TEXT NOT NULL,
  "actor_role" TEXT,
  "action" TEXT NOT NULL,
  "resource_type" TEXT NOT NULL,
  "resource_id" TEXT,
  "patient_id" TEXT,
  "ip" TEXT,
  "user_agent" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_patient_id_created_at_idx" ON "audit_logs"("patient_id", "created_at");
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");
CREATE INDEX "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");
