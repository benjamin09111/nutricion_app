ALTER TABLE "membership_plans"
ADD COLUMN IF NOT EXISTS "is_coming_soon" BOOLEAN DEFAULT false;

UPDATE "membership_plans"
SET "is_coming_soon" = false
WHERE "is_coming_soon" IS NULL;

ALTER TABLE "membership_plans"
ALTER COLUMN "is_coming_soon" SET DEFAULT false,
ALTER COLUMN "is_coming_soon" SET NOT NULL;

INSERT INTO "membership_plans" (
    "id",
    "name",
    "slug",
    "description",
    "price",
    "currency",
    "billingPeriod",
    "features",
    "entitlements",
    "maxPatients",
    "maxStorage",
    "isPopular",
    "is_coming_soon",
    "isActive",
    "displayOrder",
    "created_at",
    "updated_at"
)
VALUES
    (
        gen_random_uuid(),
        'Freemium',
        'free',
        'Ideal para nutricionistas que están conociendo y explorando NutriNet.',
        0,
        'CLP',
        'monthly',
        '["✓ 3 pacientes totales", "✓ 3 consultas guardadas", "✓ 6 PDFs generados", "✓ 6 seguimientos privados activos", "✓ Base de ingredientes", "X Usar la calculadora clínica", "✓ 1 grupo de alimentos", "✓ 4 respuestas de IA", "✓ 6 creaciones guardadas", "X Editar información de pacientes", "X Editar creaciones guardadas", "X Crear Detalles personalizados"]'::jsonb,
        '{}'::jsonb,
        3,
        NULL,
        false,
        false,
        true,
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'Plus',
        'plus',
        'Plan completo para potenciar tu consulta profesional.',
        19990,
        'CLP',
        'monthly',
        '["✓ Pacientes ilimitados", "✓ Consultas ilimitadas", "✓ PDFs y planes ilimitados", "✓ Tabla de ingredientes"]'::jsonb,
        '{}'::jsonb,
        NULL,
        NULL,
        true,
        false,
        true,
        2,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT ("slug") DO UPDATE
SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "price" = EXCLUDED."price",
    "currency" = EXCLUDED."currency",
    "billingPeriod" = EXCLUDED."billingPeriod",
    "features" = EXCLUDED."features",
    "maxPatients" = EXCLUDED."maxPatients",
    "maxStorage" = EXCLUDED."maxStorage",
    "isPopular" = EXCLUDED."isPopular",
    "is_coming_soon" = EXCLUDED."is_coming_soon",
    "isActive" = EXCLUDED."isActive",
    "displayOrder" = EXCLUDED."displayOrder",
    "updated_at" = CURRENT_TIMESTAMP;

UPDATE "membership_plans"
SET "isActive" = false,
    "updated_at" = CURRENT_TIMESTAMP
WHERE LOWER("slug") = 'pro';
