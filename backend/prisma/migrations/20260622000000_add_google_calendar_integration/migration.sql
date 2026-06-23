-- Add Google auth fields to accounts
ALTER TABLE "accounts"
  ADD COLUMN IF NOT EXISTS "google_sub" TEXT,
  ADD COLUMN IF NOT EXISTS "google_email" TEXT,
  ADD COLUMN IF NOT EXISTS "google_avatar_url" TEXT,
  ADD COLUMN IF NOT EXISTS "auth_provider" TEXT NOT NULL DEFAULT 'credentials';

CREATE UNIQUE INDEX IF NOT EXISTS "accounts_google_sub_key" ON "accounts"("google_sub");

-- Add Google sync fields to appointments
ALTER TABLE "appointments"
  ADD COLUMN IF NOT EXISTS "google_calendar_event_id" TEXT,
  ADD COLUMN IF NOT EXISTS "google_calendar_html_link" TEXT,
  ADD COLUMN IF NOT EXISTS "google_calendar_synced_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "google_calendar_sync_error" TEXT;

-- Store Google Calendar tokens and connection metadata per account
CREATE TABLE IF NOT EXISTS "google_calendar_connections" (
  "id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "google_email" TEXT NOT NULL,
  "google_sub" TEXT,
  "access_token_encrypted" TEXT,
  "refresh_token_encrypted" TEXT NOT NULL,
  "token_expiry" TIMESTAMP(3),
  "calendar_id" TEXT NOT NULL DEFAULT 'primary',
  "scope" TEXT NOT NULL,
  "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "disconnected_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "google_calendar_connections_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "google_calendar_connections_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "google_calendar_connections_account_id_key"
  ON "google_calendar_connections"("account_id");
