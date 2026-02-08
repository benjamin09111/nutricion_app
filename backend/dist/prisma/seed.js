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
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const XLSX = __importStar(require("xlsx"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Start seeding...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedUserPassword = await bcrypt.hash('password123', 10);
    await prisma.account.upsert({
        where: { email: 'admin@nutrisaas.com' },
        update: {},
        create: {
            email: 'admin@nutrisaas.com',
            password: hashedAdminPassword,
            role: 'ADMIN_GENERAL',
            status: 'ACTIVE',
        },
    });
    console.log('✅ Created Admin Account');
    const users = [
        { email: 'nutri@test.com', name: 'Dr. Test Nutritionist', role: 'NUTRITIONIST' },
        { email: 'joakomask@gmail.com', name: 'Dr. Joako Mask', role: 'NUTRITIONIST' },
        { email: 'moralespizarrobenjamin763@gmail.com', name: 'Dr. Benjamin Morales', role: 'NUTRITIONIST' }
    ];
    for (const user of users) {
        const account = await prisma.account.upsert({
            where: { email: user.email },
            update: { password: hashedUserPassword },
            create: {
                email: user.email,
                password: hashedUserPassword,
                role: user.role,
                status: 'ACTIVE',
            },
        });
        await prisma.nutritionist.upsert({
            where: { accountId: account.id },
            update: {},
            create: {
                accountId: account.id,
                fullName: user.name,
                professionalId: `RUT-${Math.floor(Math.random() * 1000000)}`,
                specialty: 'Clinical Nutrition',
            },
        });
        console.log(`✅ Upserted Nutritionist: ${user.email}`);
    }
    console.log('🥑 Seeding Ingredients from CSV...');
    try {
        const filePath = path.resolve(process.cwd(), '..', 'docs', 'data', 'foods.csv');
        if (fs.existsSync(filePath)) {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            let count = 0;
            for (const row of jsonData) {
                const name = row['Producto'] || row['name'];
                if (!name)
                    continue;
                const price = parseFloat(String(row['Precio promedio']).replace(',', '.') || '0') || 0;
                const category = row['Grupo'] || 'General';
                const brand = row['Marca'] || '';
                const existing = await prisma.ingredient.findFirst({ where: { name } });
                if (!existing) {
                    await prisma.ingredient.create({
                        data: {
                            name: name,
                            category: category,
                            brand: brand,
                            price: Math.round(price),
                            unit: row['Unidad'] || 'u',
                            amount: 1,
                            calories: row['Calorías'] ? parseFloat(String(row['Calorías']).replace(',', '.')) : 0,
                            proteins: row['Proteínas'] ? parseFloat(String(row['Proteínas']).replace(',', '.')) : 0,
                            lipids: row['Grasa Total'] ? parseFloat(String(row['Grasa Total']).replace(',', '.')) : 0,
                            carbs: row['Carbohidratos Disp'] ? parseFloat(String(row['Carbohidratos Disp']).replace(',', '.')) : 0,
                            sugars: 0,
                            fiber: 0,
                            sodium: 0,
                            tags: [],
                            isPublic: true,
                            verified: true
                        }
                    });
                    count++;
                }
            }
            console.log(`✅ Seeded ${count} ingredients from CSV.`);
        }
        else {
            console.warn(`⚠️ CSV file not found at ${filePath}. Skipping mass seed.`);
            const manualIngredients = [
                {
                    name: 'Marraqueta (Unidad)',
                    brand: 'Panadería Local',
                    category: 'Panadería',
                    price: 250,
                    unit: 'unidad',
                    amount: 100,
                    calories: 267.0,
                    proteins: 8.5,
                    lipids: 1.2,
                    carbs: 58.0,
                    isPublic: true,
                    verified: true
                },
            ];
            for (const ing of manualIngredients) {
                await prisma.ingredient.create({ data: ing }).catch(() => { });
            }
        }
    }
    catch (error) {
        console.error('❌ Error seeding from CSV:', error);
    }
    const plans = [
        {
            name: 'Plan Gratuito',
            slug: 'free',
            description: 'Ideal para nutricionistas que están comenzando su consulta.',
            price: 0,
            currency: 'CLP',
            billingPeriod: 'monthly',
            features: ['Hasta 10 pacientes', 'Cálculos nutricionales básicos', 'Exportación a PDF con marca de agua', 'Soporte vía email'],
            maxPatients: 10,
            isPopular: false,
            displayOrder: 1
        },
        {
            name: 'Plan Profesional',
            slug: 'pro',
            description: 'Todo lo que necesitas para escalar tu consulta al siguiente nivel.',
            price: 19990,
            currency: 'CLP',
            billingPeriod: 'monthly',
            features: ['Pacientes ilimitados', 'IA Generadora de Dietas', 'Lista de compras inteligente', 'Perfil de paciente CRM completo', 'Sin marcas de agua', 'Soporte prioritario'],
            maxPatients: null,
            isPopular: true,
            displayOrder: 2
        },
        {
            name: 'Plan Enterprise',
            slug: 'enterprise',
            description: 'Para clínicas y centros de salud con múltiples profesionales.',
            price: 49990,
            currency: 'CLP',
            billingPeriod: 'monthly',
            features: ['Múltiples cuentas de nutricionista', 'Gestión de inventario de suplementos', 'Integración con laboratorios', 'Panel de administración avanzado', 'Capacitación personalizada'],
            maxPatients: null,
            isPopular: false,
            displayOrder: 3
        }
    ];
    for (const plan of plans) {
        await prisma.membershipPlan.upsert({
            where: { slug: plan.slug },
            update: {
                name: plan.name,
                description: plan.description,
                price: plan.price,
                features: plan.features,
                isPopular: plan.isPopular,
                displayOrder: plan.displayOrder
            },
            create: {
                ...plan,
                features: plan.features
            },
        });
        console.log(`✅ Upserted Membership Plan: ${plan.name}`);
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