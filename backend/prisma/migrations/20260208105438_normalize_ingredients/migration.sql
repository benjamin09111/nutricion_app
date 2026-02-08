/*
  Warnings:

  - You are about to drop the column `tags` on the `ingredient_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `brand` on the `ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `ingredients` table. All the data in the column will be lost.
  - Added the required column `category_id` to the `ingredients` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ingredients_category_idx";

-- AlterTable
ALTER TABLE "ingredient_preferences" DROP COLUMN "tags";

-- AlterTable
ALTER TABLE "ingredients" DROP COLUMN "brand",
DROP COLUMN "category",
DROP COLUMN "tags",
ADD COLUMN     "brand_id" TEXT,
ADD COLUMN     "category_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ingredient_brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ingredient_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ingredient_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GlobalTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PersonalTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_brands_name_key" ON "ingredient_brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_categories_name_key" ON "ingredient_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_GlobalTags_AB_unique" ON "_GlobalTags"("A", "B");

-- CreateIndex
CREATE INDEX "_GlobalTags_B_index" ON "_GlobalTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PersonalTags_AB_unique" ON "_PersonalTags"("A", "B");

-- CreateIndex
CREATE INDEX "_PersonalTags_B_index" ON "_PersonalTags"("B");

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "ingredient_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ingredient_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GlobalTags" ADD CONSTRAINT "_GlobalTags_A_fkey" FOREIGN KEY ("A") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GlobalTags" ADD CONSTRAINT "_GlobalTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonalTags" ADD CONSTRAINT "_PersonalTags_A_fkey" FOREIGN KEY ("A") REFERENCES "ingredient_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonalTags" ADD CONSTRAINT "_PersonalTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
