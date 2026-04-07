import { PrismaClient } from '@prisma/client';
import { loadPrismaEnv } from './load-prisma-env';
import { replaceDefaultResources } from './resource-seed';

loadPrismaEnv();

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Replacing all resources from default-resources.json...');
    await prisma.$transaction(async (tx) => {
        await replaceDefaultResources(tx);
    });
}

seed()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
