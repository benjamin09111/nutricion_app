import { AccountStatus, PrismaClient, UserRole } from '@prisma/client';
import { loadPrismaEnv } from './load-prisma-env';

loadPrismaEnv();

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});
const adminEmail = 'moralespizarrobenjamin763@gmail.com';

async function main() {
  await prisma.account.upsert({
    where: { email: adminEmail },
    update: {
      role: UserRole.ADMIN_MASTER,
      status: AccountStatus.ACTIVE,
      googleEmail: adminEmail,
    },
    create: {
      email: adminEmail,
      password: null,
      googleEmail: adminEmail,
      authProvider: 'google',
      role: UserRole.ADMIN_MASTER,
      status: AccountStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  const accountCount = await prisma.account.count();
  if (accountCount !== 1) {
    throw new Error(
      `DEV must contain only the authorized admin, but ${accountCount} accounts were found.`,
    );
  }

  console.log(`Google admin ready in DEV: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
