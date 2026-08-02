CREATE TABLE "plan_usage_counters" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "feature_key" TEXT NOT NULL,
    "period_key" TEXT NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_usage_counters_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plan_usage_counters_account_id_feature_key_period_key_key"
ON "plan_usage_counters"("account_id", "feature_key", "period_key");

CREATE INDEX "plan_usage_counters_feature_key_period_key_idx"
ON "plan_usage_counters"("feature_key", "period_key");

ALTER TABLE "plan_usage_counters"
ADD CONSTRAINT "plan_usage_counters_account_id_fkey"
FOREIGN KEY ("account_id") REFERENCES "accounts"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
