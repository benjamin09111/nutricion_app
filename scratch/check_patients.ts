
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const patients = await prisma.patient.findMany({
    select: {
      id: true,
      fullName: true,
      status: true,
      nutritionistId: true,
    }
  });
  console.log(JSON.stringify(patients, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
