import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedUserPassword = await bcrypt.hash('password123', 10);

  // 1. Create Admin
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

  // 2. Create Nutritionist Users
  const users = [
    { email: 'nutri@test.com', name: 'Dr. Test Nutritionist', role: 'NUTRITIONIST' },
    { email: 'joakomask@gmail.com', name: 'Dr. Joako Mask', role: 'NUTRITIONIST' },
    { email: 'moralespizarrobenjamin763@gmail.com', name: 'Dr. Benjamin Morales', role: 'NUTRITIONIST' }
  ];

  for (const user of users) {
    const account = await prisma.account.upsert({
      where: { email: user.email },
      update: { password: hashedUserPassword }, // Update password just in case
      create: {
        email: user.email,
        password: hashedUserPassword,
        role: user.role as any,
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

  // 3. Seed Ingredients from CSV
  console.log('🥑 Seeding Ingredients from CSV...');
  try {
    const filePath = path.resolve(process.cwd(), '..', 'docs', 'data', 'foods.csv');
    if (fs.existsSync(filePath)) {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let count = 0;
      // Process in chunks or one by one
      for (const row of jsonData as any[]) {
        const name = row['Producto'] || row['name'];
        if (!name) continue;

        const price = parseFloat(String(row['Precio promedio']).replace(',', '.') || '0') || 0;
        const categoryName = row['Grupo'] || 'General';
        const brandName = row['Marca'] || '';

        const category = await prisma.ingredientCategory.upsert({
          where: { name: categoryName },
          update: {},
          create: { name: categoryName },
        });

        let brandId = undefined;
        if (brandName) {
          const brand = await prisma.ingredientBrand.upsert({
            where: { name: brandName },
            update: {},
            create: { name: brandName },
          });
          brandId = brand.id;
        }

        // Skip if exists to save time, or upsert
        const existing = await prisma.ingredient.findFirst({ where: { name } });
        if (!existing) {
          await prisma.ingredient.create({
            data: {
              name: name,
              categoryId: category.id,
              brandId: brandId,
              price: Math.round(price),
              unit: row['Unidad'] || 'u',
              amount: 1, // Default amount if missing
              calories: row['Calorías'] ? parseFloat(String(row['Calorías']).replace(',', '.')) : 0,
              proteins: row['Proteínas'] ? parseFloat(String(row['Proteínas']).replace(',', '.')) : 0,
              lipids: row['Grasa Total'] ? parseFloat(String(row['Grasa Total']).replace(',', '.')) : 0,
              carbs: row['Carbohidratos Disp'] ? parseFloat(String(row['Carbohidratos Disp']).replace(',', '.')) : 0,
              sugars: 0,
              fiber: 0,
              sodium: 0,
              isPublic: true,
              verified: true
            }
          });
          count++;
        }
      }
      console.log(`✅ Seeded ${count} ingredients from CSV.`);
    } else {
      console.warn(`⚠️ CSV file not found at ${filePath}. Skipping mass seed.`);
      // Fallback to manual seed
      const manualIngredients = [
        {
          name: 'Marraqueta (Unidad)',
          brandName: 'Panadería Local',
          categoryName: 'Panadería',
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
        const { brandName, categoryName, ...rest } = ing;

        const category = await prisma.ingredientCategory.upsert({
          where: { name: categoryName },
          update: {},
          create: { name: categoryName },
        });

        const brand = brandName ? await prisma.ingredientBrand.upsert({
          where: { name: brandName },
          update: {},
          create: { name: brandName },
        }) : null;

        await prisma.ingredient.create({
          data: {
            ...rest,
            categoryId: category.id,
            brandId: brand?.id,
          }
        }).catch(() => { });
      }
    }
  } catch (error) {
    console.error('❌ Error seeding from CSV:', error);
  }

  // 4. Create Membership Plans
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
