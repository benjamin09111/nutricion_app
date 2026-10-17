-- CreateTable
CREATE TABLE IF NOT EXISTS "landing_leads" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "practice_area" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NUEVO',
    "notes" TEXT,
    "source" TEXT DEFAULT 'jump_chile',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landing_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "landing_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "page_path" TEXT NOT NULL DEFAULT '/',
    "metadata" JSONB DEFAULT '{}',
    "referrer" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landing_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "landing_leads_email_idx" ON "landing_leads"("email");
CREATE INDEX IF NOT EXISTS "landing_leads_status_created_at_idx" ON "landing_leads"("status", "created_at");
CREATE INDEX IF NOT EXISTS "landing_leads_practice_area_idx" ON "landing_leads"("practice_area");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "landing_events_event_type_created_at_idx" ON "landing_events"("event_type", "created_at");
CREATE INDEX IF NOT EXISTS "landing_events_session_id_idx" ON "landing_events"("session_id");
