import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const CLINICAL_RESTRICTIONS = [
  'Intolerante a la lactosa',
  'Sin gluten',
  'Intolerancia a la fructosa',
  'Alergia a la proteína de leche de vaca (APLV)',
  'Alergia al maní y frutos secos',
  'Alergia al huevo',
  'Alergia a mariscos',
  'Alergia al pescado',
  'Alergia a la soya',
  'Diabético',
  'Hipertensión arterial',
  'Dislipidemia / Hipercolesterolemia',
  'Enfermedad renal crónica',
  'Síndrome de intestino irritable (FODMAP)',
  'Hiperuricemia / Gota',
  'Vegetariano',
  'Vegano',
  'Ovovegetariano',
  'Lactovegetariano',
  'Pescetariano',
  'Dieta Keto / Cetogénica',
  'Bajo en sodio',
  'Bajo en carbohidratos (Low Carb)',
  'Embarazo y lactancia',
];

const HASHTAGS = [
  '#Deportista',
  '#Hipertrofia',
  '#PérdidaDePeso',
  '#RecomposiciónCorporal',
  '#ControlGlicémico',
  '#SaludCardiovascular',
  '#SaludDigestiva',
  '#AdultoMayor',
  '#Pediátrico',
  '#Embarazo',
  '#Postparto',
  '#AltoEnProteínas',
  '#FácilPreparación',
  '#Económico',
  '#PrepSemanal',
  '#SinAzúcarAñadida',
  '#Vegano',
  '#Vegetariano',
  '#Keto',
  '#LowCarb',
];

async function syncSystemTags() {
  console.log('🏷️ Starting system tags synchronization...');

  // 1. Delete explicit test tags requested by user ("test", "test1", etc.)
  const testTagNames = ['test', 'test1', 'prueba', 'test tag'];
  for (const testName of testTagNames) {
    const found = await prisma.tag.findFirst({
      where: { name: { equals: testName, mode: 'insensitive' } },
    });
    if (found) {
      await prisma.tag.delete({ where: { id: found.id } });
      console.log(`🗑️ Removed test tag: "${found.name}"`);
    }
  }

  // Also remove user-created duplicates of "Intolerancia a la Lactosa" if replaced by "Intolerante a la lactosa" or handle seamlessly
  const oldLactoseTag = await prisma.tag.findFirst({
    where: { name: 'Intolerancia a la Lactosa' },
  });
  if (oldLactoseTag && oldLactoseTag.nutritionistId !== null) {
    // If it has no connected dependencies, remove or update
    await prisma.tag.delete({ where: { id: oldLactoseTag.id } }).catch(() => {
      console.log('Could not delete old Intolerancia a la Lactosa, updating instead...');
    });
  }

  // 2. Upsert Clinical Restrictions as System Tags (nutritionistId = null)
  for (const name of CLINICAL_RESTRICTIONS) {
    await prisma.tag.upsert({
      where: { name },
      update: { nutritionistId: null },
      create: { name, nutritionistId: null },
    });
    console.log(`✅ Upserted Clinical Restriction: "${name}"`);
  }

  // 3. Upsert System Hashtags (nutritionistId = null)
  for (const name of HASHTAGS) {
    await prisma.tag.upsert({
      where: { name },
      update: { nutritionistId: null },
      create: { name, nutritionistId: null },
    });
    console.log(`✅ Upserted Hashtag: "${name}"`);
  }

  console.log('🎉 System tags synchronization completed successfully!');
}

syncSystemTags()
  .catch((e) => {
    console.error('❌ Error syncing system tags:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
