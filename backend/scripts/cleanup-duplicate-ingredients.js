const { PrismaClient } = require('@prisma/client');
const { loadPrismaEnv, ensureSafeRemoteFlag } = require('./lib/env');

loadPrismaEnv();

const prisma = new PrismaClient();

async function main() {
  ensureSafeRemoteFlag(process.env.DIRECT_URL || process.env.DATABASE_URL, process.argv.slice(2));

  const deletedRows = await prisma.$queryRawUnsafe(`
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY lower(btrim("name")), COALESCE("brand_id", '')
      ORDER BY "verified" DESC, "is_public" DESC, "createdAt" ASC, id ASC
    ) AS rn
  FROM "ingredients"
)
DELETE FROM "ingredients"
WHERE id IN (
  SELECT id
  FROM ranked
  WHERE rn > 1
)
RETURNING id;
`);

  console.log(`Deleted duplicate ingredients: ${deletedRows.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
