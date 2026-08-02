import { PrismaClient } from '@prisma/client';
import { loadPrismaEnv } from './load-prisma-env';

loadPrismaEnv();

const prisma = new PrismaClient();

async function main() {
  const freePlan = await prisma.membershipPlan.findFirst({
    where: {
      isActive: true,
      OR: [{ price: 0 }, { slug: { contains: 'free', mode: 'insensitive' } }],
    },
    orderBy: [{ price: 'asc' }, { displayOrder: 'asc' }],
  });

  if (!freePlan) {
    throw new Error(
      'No existe un plan Freemium activo para realizar el backfill.',
    );
  }

  const accounts = await prisma.account.findMany({
    where: {
      role: { in: ['NUTRITIONIST', 'NUTRITIONIST_DEVELOPER'] },
    },
    include: { subscription: { include: { plan: true } } },
  });

  const now = new Date();
  let updated = 0;

  for (const account of accounts) {
    const subscription = account.subscription;
    const hasActivePaidPlan =
      subscription &&
      Number(subscription.plan.price) > 0 &&
      subscription.endDate &&
      subscription.endDate.getTime() > now.getTime() &&
      ['ACTIVE', 'TRIALING'].includes(subscription.status);

    if (hasActivePaidPlan) continue;

    await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: account.id },
        data: {
          plan: 'FREE',
          membershipSelectedAt: account.membershipSelectedAt || now,
          subscriptionEndsAt: null,
        },
      });
      await tx.subscription.upsert({
        where: { accountId: account.id },
        update: {
          planId: freePlan.id,
          status: 'ACTIVE',
          startDate: subscription?.startDate || now,
          endDate: null,
          cancelAtPeriodEnd: false,
          canceledAt: null,
        },
        create: {
          accountId: account.id,
          planId: freePlan.id,
          status: 'ACTIVE',
          startDate: now,
          endDate: null,
        },
      });
    });
    updated += 1;
  }

  console.log(`Freemium asociado a ${updated} nutricionistas.`);
}

main()
  .catch((error) => {
    console.error('No se pudo completar el backfill de Freemium:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
