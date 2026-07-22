UPDATE "accounts" AS a
SET "membership_selected_at" = COALESCE(a."last_login_at", a."created_at")
WHERE a."membership_selected_at" IS NULL
  AND (
    a."last_login_at" IS NOT NULL
    OR a."plan" <> 'FREE'
    OR EXISTS (
      SELECT 1
      FROM "payments" p
      WHERE p."account_id" = a."id"
    )
  );
