-- CreateTable
CREATE TABLE "recipe_library" (
    "id" TEXT NOT NULL,
    "nutritionist_id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_library_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recipe_library_nutritionist_id_recipe_id_key" ON "recipe_library"("nutritionist_id", "recipe_id");

-- CreateIndex
CREATE INDEX "recipe_library_nutritionist_id_idx" ON "recipe_library"("nutritionist_id");

-- CreateIndex
CREATE INDEX "recipe_library_recipe_id_idx" ON "recipe_library"("recipe_id");

-- AddForeignKey
ALTER TABLE "recipe_library"
ADD CONSTRAINT "recipe_library_nutritionist_id_fkey"
FOREIGN KEY ("nutritionist_id") REFERENCES "nutritionists"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_library"
ADD CONSTRAINT "recipe_library_recipe_id_fkey"
FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
