import { PrismaClient } from '@prisma/client';
import { loadPrismaEnv } from './load-prisma-env';
import { replaceDefaultResources } from './resource-seed';

loadPrismaEnv();

const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL } },
});

async function seed() {
    console.log('🌱 Syncing resources from default-resources.json non-destructively...');
    await replaceDefaultResources(prisma);
}

seed()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
