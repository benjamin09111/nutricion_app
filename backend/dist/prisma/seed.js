"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Start seeding...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminAccount = await prisma.account.upsert({
        where: { email: 'admin@nutrisaas.com' },
        update: {},
        create: {
            email: 'admin@nutrisaas.com',
            password: hashedPassword,
            role: 'ADMIN',
            status: 'ACTIVE',
        },
    });
    console.log('✅ Created Admin Account');
    const nutriAccount = await prisma.account.upsert({
        where: { email: 'nutri@test.com' },
        update: {},
        create: {
            email: 'nutri@test.com',
            password: hashedPassword,
            role: 'NUTRITIONIST',
            status: 'ACTIVE',
        },
    });
    const nutritionist = await prisma.nutritionist.upsert({
        where: { accountId: nutriAccount.id },
        update: {},
        create: {
            accountId: nutriAccount.id,
            fullName: 'Dr. Test Nutritionist',
            professionalId: '123456-7',
            specialty: 'Clinical Nutrition',
        },
    });
    console.log('✅ Created Nutritionist Account and Profile');
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