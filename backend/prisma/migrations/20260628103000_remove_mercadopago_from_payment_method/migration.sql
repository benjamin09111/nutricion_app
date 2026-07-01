-- Normalize legacy Mercado Pago payment methods before removing the enum value.
UPDATE "payments"
SET "method" = 'FLOW'
WHERE "method" = 'MERCADOPAGO';

-- Rebuild the enum without MERCADOPAGO.
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";

CREATE TYPE "PaymentMethod" AS ENUM (
  'TRANSBANK',
  'WEBPAY',
  'FLOW',
  'STRIPE',
  'BANK_TRANSFER',
  'MANUAL'
);

ALTER TABLE "payments"
  ALTER COLUMN "method" TYPE "PaymentMethod"
  USING "method"::text::"PaymentMethod";

DROP TYPE "PaymentMethod_old";
