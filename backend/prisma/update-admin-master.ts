import { PrismaClient, UserRole } from '@prisma/client';
import { loadPrismaEnv } from './load-prisma-env';

loadPrismaEnv();

const prisma = new PrismaClient();

async function main() {
  const emails = ['moralespizarrobenjamin763@gmail.com', 'admin@nutrinet.cl'];

  for (const email of emails) {
    try {
      const account = await prisma.account.update({
        where: { email },
        data: { role: UserRole.ADMIN_MASTER },
      });
      console.log(`✅ ${account.email} ahora es: ${account.role}`);
    } catch (err: any) {
      console.warn(`⚠️ No se actualizó ${email}: ${err.message}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
