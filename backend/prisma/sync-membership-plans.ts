import { PrismaClient } from '@prisma/client';
import { loadPrismaEnv } from './load-prisma-env';
import { getMembershipPlanEntitlements } from '../src/modules/memberships/plan-entitlements';

loadPrismaEnv();

const prisma = new PrismaClient();

const plans = [
  {
    name: 'Gratis',
    slug: 'free',
    description: 'Ideal para nutricionistas que están comenzando su consulta.',
    price: 0,
    currency: 'CLP',
    billingPeriod: 'monthly',
    features: [
      '✓ 3 pacientes activos',
      '✓ 5 consultas al mes',
      '✓ 5 PDFs al mes',
      '✓ 2 seguimientos privados activos',
      '✓ Base de ingredientes',
      'X Calculadora clínica',
      'X Grupos de alimento',
      '✓ 10 llamadas a IA',
      'X Relleno automático con IA',
      'X Gestión de citas',
      'X Google Calendar',
      'X Portal de nutricionista',
      'X Boletas SII',
    ],
    maxPatients: 3,
    maxStorage: null,
    isPopular: false,
    isActive: true,
    displayOrder: 1,
    entitlements: getMembershipPlanEntitlements('free'),
  },
  {
    name: 'Iniciante',
    slug: 'iniciante',
    description: 'Para nutricionistas con pocos clientes o para probar funciones extra.',
    price: 19990,
    currency: 'CLP',
    billingPeriod: 'monthly',
    features: [
      '✓ 30 pacientes activos',
      '✓ 60 consultas al mes',
      '✓ 30 PDFs al mes',
      '✓ 2 seguimientos privados activos',
      '✓ Base de ingredientes',
      '✓ Calculadora clínica',
      '✓ Grupos de alimentos',
      '✓ 20 llamadas a IA',
      'X Gestión de citas',
      'X Google Calendar',
      'X Portal de nutricionista',
      'X Boletas SII',
    ],
    maxPatients: null,
    maxStorage: null,
    isPopular: false,
    isActive: true,
    displayOrder: 2,
    entitlements: getMembershipPlanEntitlements('iniciante'),
  },
  {
    name: 'Pro',
    slug: 'pro',
    description: 'Plan profesional completo para automatizar y crecer.',
    price: 19990,
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
      '✓ Google Calendar',
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
  for (const plan of plans) {
    const existing =
      (await prisma.membershipPlan.findUnique({ where: { slug: plan.slug } })) ||
      (await prisma.membershipPlan.findFirst({ where: { name: plan.name } }));

    if (existing) {
      await prisma.membershipPlan.update({
        where: { id: existing.id },
        data: plan,
      });
    } else {
      await prisma.membershipPlan.create({ data: plan });
    }
  }
}

sync()
  .then(() => console.log('Membership plans synced successfully.'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
