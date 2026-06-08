-- AddEmailVerificationFields
ALTER TABLE "accounts" ADD COLUMN "email_verification_token" VARCHAR(255);
ALTER TABLE "accounts" ADD COLUMN "email_verification_sent_at" TIMESTAMPTZ(6);
ALTER TABLE "accounts" ADD COLUMN "email_verified_at" TIMESTAMPTZ(6);

CREATE UNIQUE INDEX IF NOT EXISTS "Account_email_verification_token_key" ON "accounts"("email_verification_token");