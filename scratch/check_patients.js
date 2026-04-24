
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const patientsCount = await prisma.patient.count();
  const patients = await prisma.patient.findMany({
    select: {
      id: true,
      fullName: true,
      status: true,
      nutritionistId: true,
    }
  });
  console.log('Total patients in DB:', patientsCount);
  console.log('Sample data:', JSON.stringify(patients.slice(0, 5), null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
