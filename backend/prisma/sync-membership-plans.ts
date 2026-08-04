import { PrismaClient } from '@prisma/client';
import { loadPrismaEnv } from './load-prisma-env';
import { getMembershipPlanEntitlements } from '../src/modules/memberships/plan-entitlements';

loadPrismaEnv();

const prisma = new PrismaClient();

const plans = [
  {
    name: 'Freemium',
    slug: 'free',
    description: 'Ideal para nutricionistas que están comenzando su consulta.',
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
      '✓ 3 creaciones guardadas',
      'X Editar información de pacientes',
      'X Editar creaciones guardadas',
      'X Crear Detalles personalizados',
    ],
    maxPatients: 4,
    maxStorage: null,
    isPopular: false,
    isActive: true,
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
    features: [
      '✓ Pacientes ilimitados',
      '✓ Consultas ilimitadas',
      '✓ PDFs ilimitados',
      '✓ Seguimientos ilimitados',
      '✓ IA ilimitada',
      '✓ Relleno automático de IA',
      '✓ Gestión de citas y horarios',
      '✓ Portal de nutricionista',
      '✓ Generación de boletas SII',
    ],
    maxPatients: null,
    maxStorage: null,
    isPopular: true,
    isActive: true,
    displayOrder: 3,
    entitlements: getMembershipPlanEntitlements('pro'),
  },
];

async function sync() {
  console.log('🔄 Syncing membership plans in database...');
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
