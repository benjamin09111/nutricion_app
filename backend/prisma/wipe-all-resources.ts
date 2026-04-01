import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ Wiping all resources from database...');
  const { count } = await prisma.resource.deleteMany();
  console.log(`✅ Success! Deleted ${count} resources.`);
}

main()
  .catch((e) => {
    console.error('❌ Error wiping resources:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
