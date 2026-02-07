import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // Create Users
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create Admin
  const adminAccount = await prisma.account.upsert({
    where: { email: 'admin@nutrisaas.com' },
    update: {},
    create: {
      email: 'admin@nutrisaas.com',
      password: hashedPassword,
      role: 'ADMIN_GENERAL',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Created Admin Account');

  // Create Nutritionist
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
    } else {
      console.log(`🔹 Skipped ${food.name} (already exists)`);
    }
  }

  // Create Membership Plans
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
        features: plan.features as any // Prisma JSON field
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
