"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Start seeding Chilean Foods...');
    const foods = [
        {
            name: 'Marraqueta (Unidad)',
            brand: 'Panadería Local',
            category: 'Panadería',
            calories: 267.0,
            proteins: 8.5,
            carbs: 58.0,
            fats: 1.2,
            tags: ['VEGAN', 'TRADICIONAL', 'BAJO_GRASA'],
            ingredients: 'Harina de trigo, agua, levadura, sal.',
            serving: { unit: 'unidad', g_per_serving: 100, price_estimate: 250 },
            isPublic: true,
        },
        {
            name: 'Palta Hass',
            brand: 'Feria',
            category: 'Frutas y Verduras',
            calories: 160.0,
            proteins: 2.0,
            carbs: 8.5,
            fats: 14.7,
            tags: ['VEGAN', 'KETO', 'SALUDABLE', 'LIBRE_DE_GLUTEN'],
            ingredients: 'Palta natural 100%',
            serving: { unit: 'g', g_per_serving: 100, price_estimate: 4900 },
            isPublic: true,
            micros: { potassium: 485, fiber: 6.7 },
        },
        {
            name: 'Yogurt Protein Vainilla',
            brand: 'Soprole',
            category: 'Lácteos',
            calories: 58.0,
            proteins: 10.0,
            carbs: 4.5,
            fats: 0.0,
            tags: ['ALTO_PROTEINA', 'SIN_AZUCAR_ANADIDA', 'LIBRE_DE_GLUTEN'],
            ingredients: 'Leche descremada, concentrado de proteína láctea, saborizante idéntico a natural, sucralosa.',
            serving: { unit: 'pote', g_per_serving: 155, price_estimate: 650 },
            isPublic: true,
            micros: { calcium: 180 },
        },
        {
            name: 'Atún al Agua',
            brand: 'San José',
            category: 'Despensa',
            calories: 116.0,
            proteins: 26.0,
            carbs: 0.0,
            fats: 0.8,
            tags: ['ALTO_PROTEINA', 'KETO', 'PESCATARIANO', 'LIBRE_DE_GLUTEN'],
            ingredients: 'Atún, agua, sal.',
            serving: { unit: 'lata', g_per_serving: 104, price_estimate: 1400 },
            isPublic: true,
            micros: { omega3: 0.5 },
        },
        {
            name: 'Avena Instantánea',
            brand: 'Quaker',
            category: 'Despensa',
            calories: 370.0,
            proteins: 14.0,
            carbs: 66.0,
            fats: 7.0,
            tags: ['VEGAN', 'ALTO_FIBRA', 'INTEGRAL'],
            ingredients: 'Avena laminada precocida.',
            serving: { unit: 'taza', g_per_serving: 40, price_estimate: 100 },
            isPublic: true,
        },
        {
            name: 'Cochayuyo',
            brand: 'Pacífico Sur',
            category: 'Frutas y Verduras',
            calories: 85.0,
            proteins: 12.0,
            carbs: 48.0,
            fats: 0.3,
            tags: ['VEGAN', 'ALTO_YODO', 'SUPERFOOD', 'LIBRE_DE_GLUTEN'],
            ingredients: 'Alga cochayuyo seca.',
            serving: { unit: 'paquete', g_per_serving: 50, price_estimate: 2000 },
            isPublic: true,
        },
    ];
    for (const food of foods) {
        const existing = await prisma.food.findFirst({ where: { name: food.name } });
        if (!existing) {
            await prisma.food.create({ data: food });
            console.log(`✅ Created ${food.name}`);
        }
        else {
            console.log(`🔹 Skipped ${food.name} (already exists)`);
        }
    }
    console.log('🏁 Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map