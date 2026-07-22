-- Create account_deletion_requests table
CREATE TABLE "account_deletion_requests" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "account_id" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by_admin" TEXT,
    "admin_notes" TEXT,

    CONSTRAINT "account_deletion_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "account_deletion_requests_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT
);

-- Create indexes
CREATE INDEX "account_deletion_requests_account_id_idx" ON "account_deletion_requests"("account_id");
CREATE INDEX "account_deletion_requests_status_idx" ON "account_deletion_requests"("status");
