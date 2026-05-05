import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function normalizeIngredientKey(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

async function main() {
  console.log('Starting seed process...');

  // 1. Categories
  const categoriesPath = path.join(__dirname, '..', '..', 'categories.txt');
  const categoriesRaw = fs.readFileSync(categoriesPath, 'utf8');
  const categoryNames = categoriesRaw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  console.log(`Found ${categoryNames.length} categories.`);

  const categoryMap = new Map<string, string>();

  for (const name of categoryNames) {
    const category = await prisma.ingredientCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryMap.set(name, category.id);
  }

  // 2. Ingredients
  const ingredientsPath = path.join(__dirname, '..', '..', 'ingredients.txt');
  const ingredientsRaw = fs.readFileSync(ingredientsPath, 'utf8');
  const lines = ingredientsRaw
    .split('\n')
    .filter((line) => line.trim().length > 0);

  console.log(`Found ${lines.length} ingredients.`);

  // Optional: Clear existing public ingredients if resetting
  await prisma.ingredient.deleteMany({
    where: { isPublic: true, verified: true },
  });

  const ingredientsData = [];
  const seenKeys = new Set<string>();
  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length < 12) continue;

    const [
      name,
      categoryName,
      calories,
      proteins,
      carbs,
      lipids,
      sugars,
      fiber,
      sodium,
      unit,
      amount,
      price,
    ] = parts;

    const categoryId = categoryMap.get(categoryName.trim());
    if (!categoryId) {
      console.warn(
        `Category not found for ingredient: ${name} (${categoryName})`,
      );
      continue;
    }

    const normalizedName = name.trim();
    const duplicateKey = normalizeIngredientKey(normalizedName);
    if (seenKeys.has(duplicateKey)) {
      continue;
    }
    seenKeys.add(duplicateKey);

    ingredientsData.push({
      name: normalizedName,
      categoryId,
      calories: parseFloat(calories) || 0,
      proteins: parseFloat(proteins) || 0,
      carbs: parseFloat(carbs) || 0,
      lipids: parseFloat(lipids) || 0,
      sugars: parseFloat(sugars) || 0,
      fiber: parseFloat(fiber) || 0,
      sodium: parseFloat(sodium) || 0,
      unit: unit.trim(),
      amount: parseFloat(amount) || 100,
      price: parseInt(price) || 0,
      isPublic: true,
      verified: true,
    });
  }

  let createdCount = 0;
  if (ingredientsData.length > 0) {
    const result = await prisma.ingredient.createMany({
      data: ingredientsData,
      skipDuplicates: true,
    });
    createdCount = result.count;
  }

  console.log(
    `Seeding finished. Created/Verified ${createdCount} ingredients.`,
  );
}

main()
  .catch((e) => {
    console.error('SEED ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
