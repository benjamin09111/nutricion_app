import * as dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

const { loadEnvFile, redactDbUrl } = require('./lib/env');
const { env } = loadEnvFile('.env');
const { PrismaClient, SubscriptionPlan, SubscriptionStatus, UserRole } = require('@prisma/client');

const dbUrl = env.DATABASE === 'prod' ? env.DATABASE_URL : (env.DATABASE_URL_DEV || env.DATABASE_URL);
if (!dbUrl) {
  throw new Error('No se encontró URL de base de datos en .env.');
}

console.log(`🔌 Conectando a la base de datos: ${redactDbUrl(dbUrl)}`);

process.env.DATABASE_URL = dbUrl;

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});

const TARGET_EMAIL = 'benjamin.morales3@mail.udp.cl';

async function main() {
  console.log(`🔍 Buscando cuenta para: ${TARGET_EMAIL}...`);

  const account = await prisma.account.findFirst({
    where: {
      OR: [
        { email: TARGET_EMAIL },
        { googleEmail: TARGET_EMAIL },
      ],
    },
    include: { subscription: true },
  });

  if (!account) {
    throw new Error(`Cuenta no encontrada para ${TARGET_EMAIL}`);
  }

  // Buscar el plan de membresía PRO activo
  const plans = await prisma.membershipPlan.findMany({
    orderBy: { price: 'desc' },
  });

  console.log('Planes en la base de datos:', plans.map((p: any) => `${p.name} (${p.slug}) - $${p.price}`));

  const proPlan = plans.find((p: any) => p.slug.includes('pro')) || plans.find((p: any) => Number(p.price) > 0) || plans[0];

  if (!proPlan) {
    throw new Error('No se encontró ningún plan de membresía en la base de datos.');
  }

  console.log(`💎 Asignando plan de pago: ${proPlan.name} (slug: ${proPlan.slug}, ID: ${proPlan.id})`);

  const futureDate = new Date('2028-01-01T00:00:00.000Z');

  // 1. Upsert Subscription
  await prisma.subscription.upsert({
    where: { accountId: account.id },
    create: {
      accountId: account.id,
      planId: proPlan.id,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      endDate: futureDate,
      cancelAtPeriodEnd: false,
    },
    update: {
      planId: proPlan.id,
      status: SubscriptionStatus.ACTIVE,
      endDate: futureDate,
      cancelAtPeriodEnd: false,
      canceledAt: null,
    },
  });

  // 2. Actualizar Account
  await prisma.account.update({
    where: { id: account.id },
    data: {
      role: UserRole.NUTRITIONIST,
      plan: SubscriptionPlan.PRO,
      subscriptionEndsAt: futureDate,
      membershipSelectedAt: new Date(),
    },
  });

  console.log(`\n🎉 ¡CUENTA ACTUALIZADA A PLAN PRO DE PAGO EXITOSAMENTE! 🎉`);
  console.log(`--------------------------------------------------`);
  console.log(`👤 Usuario: ${account.email}`);
  console.log(`⭐ Rol: NUTRITIONIST`);
  console.log(`💎 Plan de Cuenta: PRO`);
  console.log(`📦 Membresía: ${proPlan.name} ($${proPlan.price} CLP)`);
  console.log(`📅 Vigencia hasta: ${futureDate.toISOString().slice(0, 10)}`);
  console.log(`🔓 Acceso: 100% Ilimitado, sin pantallas de bloqueo ni restricciones`);
  console.log(`--------------------------------------------------`);
}

main()
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
