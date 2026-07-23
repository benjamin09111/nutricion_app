-- Every nutritionist account must have an active Freemium membership.
WITH free_plan AS (
    SELECT "id"
    FROM "membership_plans"
    WHERE "isActive" = true
      AND (LOWER("slug") LIKE '%free%' OR "price" = 0)
    ORDER BY "displayOrder" ASC
    LIMIT 1
), missing_memberships AS (
    SELECT a."id" AS account_id, fp."id" AS plan_id
    FROM "accounts" a
    CROSS JOIN free_plan fp
    WHERE a."role" IN ('NUTRITIONIST', 'NUTRITIONIST_DEVELOPER')
      AND NOT EXISTS (
          SELECT 1
          FROM "subscriptions" s
          WHERE s."account_id" = a."id"
      )
)
INSERT INTO "subscriptions" (
    "id",
    "account_id",
    "plan_id",
    "status",
    "start_date",
    "end_date",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    account_id,
    plan_id,
    'ACTIVE'::"SubscriptionStatus",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 month',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM missing_memberships;

UPDATE "accounts" a
SET
    "plan" = 'FREE'::"SubscriptionPlan",
    "membership_selected_at" = COALESCE("membership_selected_at", CURRENT_TIMESTAMP),
    "subscription_ends_at" = COALESCE("subscription_ends_at", CURRENT_TIMESTAMP + INTERVAL '1 month')
WHERE a."role" IN ('NUTRITIONIST', 'NUTRITIONIST_DEVELOPER')
  AND EXISTS (
      SELECT 1
      FROM "subscriptions" s
      JOIN "membership_plans" mp ON mp."id" = s."plan_id"
      WHERE s."account_id" = a."id"
        AND LOWER(mp."slug") LIKE '%free%'
  );
