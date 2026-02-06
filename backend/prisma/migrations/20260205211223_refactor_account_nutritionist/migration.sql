-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'NUTRITIONIST');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'NUTRITIONIST',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutritionists" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "professional_id" TEXT,
    "specialty" TEXT,
    "phone" TEXT,
    "avatar_url" TEXT,
    "settings" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutritionists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "nutritionist_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "document_id" TEXT,
    "birth_date" TIMESTAMP(3),
    "gender" TEXT,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "proteins" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fats" DOUBLE PRECISION NOT NULL,
    "tags" TEXT[],
    "ingredients" TEXT,
    "micros" JSONB,
    "serving" JSONB,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "nutritionist_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_preferences" (
    "id" TEXT NOT NULL,
    "nutritionist_id" TEXT NOT NULL,
    "food_id" TEXT NOT NULL,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "food_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_price_records" (
    "id" TEXT NOT NULL,
    "anio" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "semana" TEXT NOT NULL,
    "fecha_inicio" TEXT NOT NULL,
    "fecha_termino" TEXT NOT NULL,
    "id_region" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "tipo_punto_monitoreo" TEXT NOT NULL,
    "grupo" TEXT NOT NULL,
    "producto" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "precio_minimo" DOUBLE PRECISION NOT NULL,
    "precio_maximo" DOUBLE PRECISION NOT NULL,
    "precio_promedio" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "food_price_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "nutritionists_accountId_key" ON "nutritionists"("accountId");

-- CreateIndex
CREATE INDEX "foods_name_idx" ON "foods"("name");

-- CreateIndex
CREATE INDEX "foods_category_idx" ON "foods"("category");

-- CreateIndex
CREATE UNIQUE INDEX "food_preferences_nutritionist_id_food_id_key" ON "food_preferences"("nutritionist_id", "food_id");

-- CreateIndex
CREATE INDEX "food_price_records_producto_idx" ON "food_price_records"("producto");

-- CreateIndex
CREATE INDEX "food_price_records_region_idx" ON "food_price_records"("region");

-- CreateIndex
CREATE INDEX "food_price_records_grupo_idx" ON "food_price_records"("grupo");

-- AddForeignKey
ALTER TABLE "nutritionists" ADD CONSTRAINT "nutritionists_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_nutritionist_id_fkey" FOREIGN KEY ("nutritionist_id") REFERENCES "nutritionists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foods" ADD CONSTRAINT "foods_nutritionist_id_fkey" FOREIGN KEY ("nutritionist_id") REFERENCES "nutritionists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_preferences" ADD CONSTRAINT "food_preferences_nutritionist_id_fkey" FOREIGN KEY ("nutritionist_id") REFERENCES "nutritionists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_preferences" ADD CONSTRAINT "food_preferences_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
