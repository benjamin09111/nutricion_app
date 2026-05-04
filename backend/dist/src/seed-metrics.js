"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const defaultMetrics = [
        { name: 'Peso', unit: 'kg', key: 'weight', icon: 'Weight', color: '#3b82f6' },
        { name: 'Grasa Corporal', unit: '%', key: 'body_fat', icon: 'Activity', color: '#10b981' },
        { name: 'Masa Muscular', unit: 'kg', key: 'muscle_mass', icon: 'Dumbbell', color: '#f59e0b' },
        { name: 'Grasa Visceral', unit: 'lvl', key: 'visceral_fat', icon: 'Zap', color: '#ef4444' },
        { name: 'Cintura', unit: 'cm', key: 'waist', icon: 'Target', color: '#ec4899' },
    ];
    console.log('Seeding default metrics...');
    for (const m of defaultMetrics) {
        await prisma.metricDefinition.upsert({
            where: { key: m.key },
            update: {},
            create: {
                ...m,
                nutritionistId: null,
            },
        });
    }
    console.log('Default metrics seeded successfully.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-metrics.js.map