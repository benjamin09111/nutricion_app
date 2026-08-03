import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import { loadPrismaEnv } from './load-prisma-env';
import { getMembershipPlanEntitlements } from '../src/modules/memberships/plan-entitlements';

loadPrismaEnv();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedUserPassword = await bcrypt.hash('password123', 10);

  // 1. Create Admin
  await prisma.account.upsert({
    where: { email: 'admin@NutriNet.com' },
    update: {},
    create: {
      email: 'admin@NutriNet.com',
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
    { email: 'moralespizarrobenjamin763@gmail.com', name: 'Dr. Benjamin Morales', role: 'ADMIN_MASTER' }
  ];

  for (const user of users) {
    const account = await prisma.account.upsert({
      where: { email: user.email },
      update: { role: user.role as any, password: hashedUserPassword },
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

  // 3. Seed Ingredients from root data/ingredients.txt
  console.log('🥑 Seeding Ingredients from root data/ingredients.txt...');
  try {
    const rootDataDir = path.resolve(__dirname, '../../data');
    const txtPath = path.join(rootDataDir, 'ingredients.txt');
    if (fs.existsSync(txtPath)) {
      const lines = fs
        .readFileSync(txtPath, 'utf-8')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      // Collect categories first
      const categoryNames = Array.from(
        new Set(
          lines
            .map((line) => line.split(',')[1]?.trim())
            .filter((c): c is string => Boolean(c))
        )
      );

      for (const catName of categoryNames) {
        await prisma.ingredientCategory.upsert({
          where: { name: catName },
          update: {},
          create: { name: catName },
        });
      }

      const allCategories = await prisma.ingredientCategory.findMany();
      const categoryMap = new Map(allCategories.map((c) => [c.name, c.id]));

      const existingIngredients = await prisma.ingredient.findMany({
        select: { name: true },
      });
      const existingNameSet = new Set(
        existingIngredients.map((i) => i.name.toLowerCase().trim())
      );

      const ingredientsToInsert: any[] = [];
      const seenInBatch = new Set<string>();

      for (const line of lines) {
        const cols = line.split(',');
        if (cols.length < 11) continue;

        const name = cols[0].trim();
        const categoryName = cols[1].trim() || 'General';
        const categoryId = categoryMap.get(categoryName);
        if (!name || !categoryId) continue;

        const key = name.toLowerCase().trim();
        if (existingNameSet.has(key) || seenInBatch.has(key)) continue;
        seenInBatch.add(key);

        const calories = parseFloat(cols[2]) || 0;
        const proteins = parseFloat(cols[3]) || 0;
        const carbs = parseFloat(cols[4]) || 0;
        const lipids = parseFloat(cols[5]) || 0;
        const sugars = parseFloat(cols[6]) || 0;
        const fiber = parseFloat(cols[7]) || 0;
        const sodium = parseFloat(cols[8]) || 0;
        const unit = cols[9]?.trim() || 'g';
        const amount = parseFloat(cols[10]) || 100;
        const price = parseFloat(cols[11]) || 0;

        ingredientsToInsert.push({
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
          price: Math.round(price),
          isPublic: true,
          verified: true,
        });
      }

      if (ingredientsToInsert.length > 0) {
        const created = await prisma.ingredient.createMany({
          data: ingredientsToInsert,
          skipDuplicates: true,
        });
        console.log(`✅ Bulk inserted ${created.count} new ingredients (processed ${lines.length} rows).`);
      } else {
        console.log(`ℹ️ Ingredients already up to date (${existingNameSet.size} in DB).`);
      }
    } else {
      console.warn(`⚠️ TXT file not found at ${txtPath}.`);
    }
  } catch (error) {
    console.error('❌ Error seeding ingredients from TXT:', error);
  }

  // 4. Create Membership Plans
  const plans = [
    {
      name: 'Freemium',
      slug: 'free',
      description: 'Ideal para nutricionistas que están comenzando su consulta.',
      price: 0,
      currency: 'CLP',
      billingPeriod: 'monthly',
      features: [
        '✓ 4 pacientes totales',
        '✓ 3 consultas guardadas',
        '✓ 3 PDFs generados',
        '✓ 6 seguimientos privados activos',
        '✓ Base de ingredientes',
        'X Usar la calculadora clínica',
        '✓ 1 grupo de alimentos',
        '✓ 4 respuestas de IA',
        '✓ 3 creaciones guardadas',
        'X Editar información de pacientes',
        'X Editar creaciones guardadas',
        'X Crear Detalles personalizados',
      ],
      maxPatients: 4,
      isPopular: false,
      displayOrder: 1,
      entitlements: getMembershipPlanEntitlements('free'),
    },
    {
      name: 'Pro',
      slug: 'pro',
      description: 'Plan profesional completo para automatizar y crecer.',
      price: 39990,
      currency: 'CLP',
      billingPeriod: 'monthly',
      features: ['✓ Pacientes ilimitados', '✓ Consultas ilimitadas', '✓ PDFs ilimitados', '✓ Relleno automático de IA', '✓ Gestión de citas', '✓ Portal de nutricionista', '✓ Boletas SII'],
      maxPatients: null,
      isPopular: false,
      displayOrder: 3,
      entitlements: getMembershipPlanEntitlements('pro'),
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
        entitlements: plan.entitlements,
        isPopular: plan.isPopular,
        displayOrder: plan.displayOrder
      },
      create: {
        ...plan,
        features: plan.features as any
      },
    });
    console.log(`✅ Upserted Membership Plan: ${plan.name}`);
  }

  // 5. Seed Default Tags (Clinical Restrictions)
  const defaultTags = [
    'Diabético',
    'Hipertensión',
    'Vegetariano',
    'Celiaco',
    'Sin Gluten'
  ];

  for (const tagName of defaultTags) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });
  }
  console.log('✅ Seeded default clinical restrictions as tags.');

  // 6. Seed all platform resources non-destructively
  console.log('📚 Syncing all platform resources from root data JSON files...');
  const rootDataDir = path.resolve(__dirname, '../../data');
  const resourceFiles = [
    path.join(rootDataDir, 'nutri_resources.json'),
    path.join(rootDataDir, 'restriction_resources.json'),
    path.join(rootDataDir, 'seed_resources.json'),
    path.resolve(__dirname, '../src/data/default-resources.json'),
  ];

  const existingResources = await prisma.resource.findMany({
    select: { id: true, title: true, nutritionistId: true },
  });
  const existingIds = new Set(existingResources.map((r) => r.id));
  const existingTitleKeys = new Set(
    existingResources.map((r) => `${r.title.toLowerCase().trim()}_${r.nutritionistId || 'null'}`)
  );

  const resourcesToCreate: any[] = [];

  for (const filePath of resourceFiles) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      const items: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.resources)
          ? parsed.resources
          : [];

      for (const item of items) {
        if (!item.title) continue;

        const titleKey = `${item.title.toLowerCase().trim()}_${item.nutritionistId || 'null'}`;
        if (item.id && existingIds.has(item.id)) continue;
        if (existingTitleKeys.has(titleKey)) continue;

        existingTitleKeys.add(titleKey);
        if (item.id) existingIds.add(item.id);

        resourcesToCreate.push({
          ...(item.id ? { id: item.id } : {}),
          title: item.title,
          content: item.content || '',
          category: item.category || 'general',
          tags: Array.isArray(item.tags) ? item.tags : [],
          sources: item.sources || null,
          format: item.format || 'HTML',
          fileUrl: item.fileUrl || null,
          isPublic: item.isPublic ?? true,
          nutritionistId: item.nutritionistId || null,
        });
      }
    } catch (err) {
      console.error(`❌ Error parsing resource JSON at ${filePath}:`, err);
    }
  }

  if (resourcesToCreate.length > 0) {
    const created = await prisma.resource.createMany({
      data: resourcesToCreate,
      skipDuplicates: true,
    });
    console.log(`✅ Bulk inserted ${created.count} new resources (detalles).`);
  } else {
    console.log(`ℹ️ Platform resources already up to date (${existingResources.length} in DB).`);
  }

  console.log('🏁 Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
