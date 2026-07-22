import { PrismaClient } from '@prisma/client';
import { loadPrismaEnv } from './load-prisma-env';
import { upsertRestrictionResources } from './resource-seed';

loadPrismaEnv();

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Syncing default restriction resources...');
  await upsertRestrictionResources(prisma);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
