-- Add recipe support to ingredient_group_entries
ALTER TABLE "ingredient_group_entries"
ADD COLUMN "recipe_id" TEXT;

ALTER TABLE "ingredient_group_entries"
ALTER COLUMN "ingredient_id" DROP NOT NULL;

CREATE INDEX "ingredient_group_entries_recipe_id_idx"
ON "ingredient_group_entries"("recipe_id");

ALTER TABLE "ingredient_group_entries"
ADD CONSTRAINT "ingredient_group_entries_recipe_id_fkey"
FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
