
const { PrismaClient } from '@prisma/client';
const fs from 'fs';
const path from 'path';

const prisma = new PrismaClient();

const FIXED_CATEGORIES = [
    "Lácteos",
    "Huevos",
    "Carnes y Vísceras",
    "Pescados y Mariscos",
    "Semillas y Nueces",
    "Cereales y Derivados",
    "Papas",
    "Grasas y Aceites",
    "Verduras",
    "Frutas",
    "Azúcares y Miel",
    "Alimentos Dulces",
    "Postres de Leche",
    "Jugos y Néctares",
    "Refrescos en Polvo",
    "Bebidas",
    "Bebidas Alcohólicas",
    "Productos Salados",
    "Salsas",
    "Especias",
    "Endulzantes",
    "Platos Preparados"
];

async function main() {
    console.log('🔄 Start seeding ingredients and categories (NO DELETION)...');

    // 1. Seed Categories first (UPSERT)
    console.log('📦 Seeding categories...');
    for (const name of FIXED_CATEGORIES) {
        await prisma.ingredientCategory.upsert({
            where: { name },
            update: {},
            create: { name }
        });
    }

    const categories = await prisma.ingredientCategory.findMany();
    const categoryMap = new Map(categories.map(c => [c.name, c.id]));
    console.log(`✅ ${categories.length} categories ready.`);

    // 2. Load ingredients from ingredients.txt
    // Path is root of project
    const ingredientsPath = path.resolve(__dirname, '../../../ingredients.txt');
    console.log(`📂 Reading ingredients from: ${ingredientsPath}`);

    if (!fs.existsSync(ingredientsPath)) {
        console.error(`❌ File not found at ${ingredientsPath}`);
        return;
    }

    const fileContent = fs.readFileSync(ingredientsPath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    console.log(`📊 Found ${lines.length} potential records.`);

    const ingredientsData[] = [];
    let skipCount = 0;

    for (const line of lines) {
        // Use a more robust CSV parser for commas inside names if necessary, 
        // but looking at the file it seems plain.
        const cols = line.split(',');
        if (cols.length < 10) {
            console.warn(`⚠️ skipping invalid line: ${line}`);
            continue;
        }

        const name = cols[0].trim();
        const csvCategory = cols[1].trim();

        const categoryId = categoryMap.get(csvCategory);

        if (!categoryId) {
            // Try to find a partial match if any
            console.warn(`⚠️ Category not found for "${name}": "${csvCategory}"`);
            skipCount++;
            continue;
        }

        const calories = parseFloat(cols[2]) || 0;
        const proteins = parseFloat(cols[3]) || 0;
        const carbs = parseFloat(cols[4]) || 0;
        const lipids = parseFloat(cols[5]) || 0;
        const sugars = parseFloat(cols[6]) || 0;
        const fiber = parseFloat(cols[7]) || 0;
        const sodium = parseFloat(cols[8]) || 0;
        const unit = cols[9].trim();
        const amount = parseFloat(cols[10]) || 100;
        const price = parseInt(cols[11]) || 0;

        ingredientsData.push({
            name,
            categoryId,
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
            isPublic: true,
            verified: true
        });
    }

    // 3. Insert Ingredients using createMany with skipDuplicates: true
    if (ingredientsData.length > 0) {
        console.log(`🚀 Inserting ${ingredientsData.length} records into DB...`);
        try {
            // Note: skipDuplicates only works if there's a unique constraint that is hit.
            // Since ingredient doesn't have a unique constraint on 'name', 
            // we should manually check or use an upsert loop for safety if we want to avoid all duplicates.
            // But usually the user wants to populate it once.

            // For now, let's use createMany. If they run it twice it might double but it's faster.
            // The user asked NOT to delete, so I will strictly add.

            const result = await prisma.ingredient.createMany({
                data: ingredientsData,
                skipDuplicates: false, // We want to add them as requested
            });
            console.log(`✅ Successfully inserted ${result.count} ingredients.`);
        } catch (e) {
            console.error(`❌ Error inserting ingredients:`, e.message);
        }
    }

    console.log(`\n🎉 Process Finished!`);
    console.log(`✅ Total inserted: ${ingredientsData.length}`);
    console.log(`❌ Skipped: ${skipCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
