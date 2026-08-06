import { PrismaClient } from '@prisma/client';
import { loadPrismaEnv } from './load-prisma-env';
import { getMembershipPlanEntitlements } from '../src/modules/memberships/plan-entitlements';

loadPrismaEnv();

const prisma = new PrismaClient();

const plans = [
  {
    name: 'Freemium',
    slug: 'free',
    description: 'Ideal para nutricionistas que están conociendo y explorando Nutrinet.',
    price: 0,
    currency: 'CLP',
    billingPeriod: 'monthly',
    features: [
      '✓ 3 pacientes totales',
      '✓ 3 consultas guardadas',
      '✓ 6 PDFs generados',
      '✓ 6 seguimientos privados activos',
      '✓ Base de ingredientes',
      'X Usar la calculadora clínica',
      '✓ 1 grupo de alimentos',
      '✓ 4 respuestas de IA',
      '✓ 6 creaciones guardadas',
      'X Editar información de pacientes',
      'X Editar creaciones guardadas',
      'X Crear Detalles personalizados',
    ],
    maxPatients: 3,
    maxStorage: null,
    isPopular: false,
    isActive: true,
    displayOrder: 1,
    entitlements: getMembershipPlanEntitlements('free'),
  },
  {
    name: 'Plus',
    slug: 'plus',
    description: 'Plan completo para potenciar tu consulta profesional.',
    price: 19990,
    currency: 'CLP',
    billingPeriod: 'monthly',
    features: [
      '✓ Pacientes ilimitados',
      '✓ Consultas ilimitadas',
      '✓ PDFs y planes ilimitados',
      '✓ Tabla de ingredientes',
    ],
    maxPatients: null,
    maxStorage: null,
    isPopular: true,
    isActive: true,
    displayOrder: 2,
    entitlements: getMembershipPlanEntitlements('plus'),
  },
];

async function sync() {
  console.log('🔄 Syncing membership plans in database...');

  // Deactivate pro plan if it exists
  await prisma.membershipPlan.updateMany({
    where: { slug: 'pro' },
    data: { isActive: false },
  });

  for (const plan of plans) {
    const existing =
      (await prisma.membershipPlan.findUnique({ where: { slug: plan.slug } })) ||
      (await prisma.membershipPlan.findFirst({ where: { name: plan.name } }));

    if (existing) {
      await prisma.membershipPlan.update({
        where: { id: existing.id },
        data: plan,
      });
      console.log(`✅ Plan '${plan.name}' actualizado.`);
    } else {
      await prisma.membershipPlan.create({ data: plan });
      console.log(`✅ Plan '${plan.name}' creado.`);
    }
  }
}

sync()
  .then(() => console.log('🎉 Membership plans synced successfully.'))
  .catch((error) => {
    console.error('❌ Error syncing membership plans:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
