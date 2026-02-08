/*
  Warnings:

  - You are about to drop the `food_preferences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `foods` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "food_preferences" DROP CONSTRAINT "food_preferences_food_id_fkey";

-- DropForeignKey
ALTER TABLE "food_preferences" DROP CONSTRAINT "food_preferences_nutritionist_id_fkey";

-- DropForeignKey
ALTER TABLE "foods" DROP CONSTRAINT "foods_nutritionist_id_fkey";

-- DropTable
DROP TABLE "food_preferences";

-- DropTable
DROP TABLE "foods";

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "calories" DOUBLE PRECISION NOT NULL,
    "proteins" DOUBLE PRECISION NOT NULL,
    "lipids" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbs" DOUBLE PRECISION NOT NULL,
    "sugars" DOUBLE PRECISION DEFAULT 0,
    "fiber" DOUBLE PRECISION DEFAULT 0,
    "sodium" DOUBLE PRECISION DEFAULT 0,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "ingredients" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "nutritionist_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_preferences" (
    "id" TEXT NOT NULL,
    "nutritionist_id" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "is_not_recommended" BOOLEAN NOT NULL DEFAULT false,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "ingredient_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ingredients_name_idx" ON "ingredients"("name");

-- CreateIndex
CREATE INDEX "ingredients_category_idx" ON "ingredients"("category");

-- CreateIndex
CREATE INDEX "ingredients_is_public_verified_idx" ON "ingredients"("is_public", "verified");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_preferences_nutritionist_id_ingredient_id_key" ON "ingredient_preferences"("nutritionist_id", "ingredient_id");

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_nutritionist_id_fkey" FOREIGN KEY ("nutritionist_id") REFERENCES "nutritionists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_preferences" ADD CONSTRAINT "ingredient_preferences_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_preferences" ADD CONSTRAINT "ingredient_preferences_nutritionist_id_fkey" FOREIGN KEY ("nutritionist_id") REFERENCES "nutritionists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
