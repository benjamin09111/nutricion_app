const { PrismaClient } = require('@prisma/client');
const { loadEnvFile, ensureSafeRemoteFlag } = require('./lib/env');

loadEnvFile();

const prisma = new PrismaClient();

async function main() {
  ensureSafeRemoteFlag(process.env.DIRECT_URL || process.env.DATABASE_URL, process.argv.slice(2));

  console.log('Fetching all ingredients to identify duplicates...');
  const ingredients = await prisma.ingredient.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const groups = {};
  for (const ing of ingredients) {
    const key = `${ing.name.trim().toLowerCase()}::${ing.brandId || ''}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(ing);
  }

  const loserToWinnerMap = new Map();
  const loserIds = [];
  const duplicateGroups = [];

  for (const [key, list] of Object.entries(groups)) {
    if (list.length <= 1) continue;

    // Sort: verified first, public first, older first
    list.sort((a, b) => {
      if (a.verified !== b.verified) return a.verified ? -1 : 1;
      if (a.isPublic !== b.isPublic) return a.isPublic ? -1 : 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const winner = list[0];
    const losers = list.slice(1);

    for (const loser of losers) {
      loserToWinnerMap.set(loser.id, winner.id);
      loserIds.push(loser.id);
    }
    duplicateGroups.push({ winner, losers });
  }

  console.log(`Found ${duplicateGroups.length} duplicate groups containing ${loserIds.length} duplicate ingredients to merge.`);

  if (loserIds.length === 0) {
    console.log('No duplicates found. Nothing to do.');
    return;
  }

  // Fetch only the references that actually involve the loser ingredients
  console.log('Fetching related records referencing duplicate ingredients...');
  const [recipeIngredients, groupEntries, loserPrefs, allWinnerPrefs] = await Promise.all([
    prisma.recipeIngredient.findMany({
      where: { ingredientId: { in: loserIds } },
    }),
    prisma.ingredientGroupEntry.findMany({
      where: { ingredientId: { in: loserIds } },
    }),
    prisma.ingredientPreference.findMany({
      where: { ingredientId: { in: loserIds } },
    }),
    // Query preferences for the winners to check for @@unique violations
    prisma.ingredientPreference.findMany({
      where: { ingredientId: { in: Array.from(new Set(loserToWinnerMap.values())) } },
    }),
  ]);

  console.log(`Found:`);
  console.log(`- ${recipeIngredients.length} RecipeIngredients referencing duplicates`);
  console.log(`- ${groupEntries.length} IngredientGroupEntries referencing duplicates`);
  console.log(`- ${loserPrefs.length} IngredientPreferences referencing duplicates`);

  // Process RecipeIngredients
  if (recipeIngredients.length > 0) {
    console.log(`Re-linking ${recipeIngredients.length} recipe ingredients...`);
    for (const ri of recipeIngredients) {
      const winnerId = loserToWinnerMap.get(ri.ingredientId);
      console.log(`  Updating RecipeIngredient ${ri.id} to use winner ingredient ${winnerId}`);
      await prisma.recipeIngredient.update({
        where: { id: ri.id },
        data: { ingredientId: winnerId },
      });
    }
  }

  // Process IngredientGroupEntries
  if (groupEntries.length > 0) {
    console.log(`Re-linking ${groupEntries.length} group entries...`);
    for (const ige of groupEntries) {
      const winnerId = loserToWinnerMap.get(ige.ingredientId);
      console.log(`  Updating IngredientGroupEntry ${ige.id} to use winner ingredient ${winnerId}`);
      await prisma.ingredientGroupEntry.update({
        where: { id: ige.id },
        data: { ingredientId: winnerId },
      });
    }
  }

  // Process IngredientPreferences
  if (loserPrefs.length > 0) {
    console.log(`Processing ${loserPrefs.length} ingredient preferences...`);
    // Create a lookup for winner preferences: "nutritionistId::winnerIngredientId" -> preference object
    const winnerPrefLookup = new Map();
    for (const pref of allWinnerPrefs) {
      winnerPrefLookup.set(`${pref.nutritionistId}::${pref.ingredientId}`, pref);
    }

    for (const pref of loserPrefs) {
      const winnerId = loserToWinnerMap.get(pref.ingredientId);
      const key = `${pref.nutritionistId}::${winnerId}`;
      const winnerPref = winnerPrefLookup.get(key);

      if (winnerPref) {
        console.log(`  Preference already exists for winner. Deleting preference ${pref.id}`);
        await prisma.ingredientPreference.delete({
          where: { id: pref.id },
        });
      } else {
        console.log(`  Updating preference ${pref.id} to use winner ingredient ${winnerId}`);
        await prisma.ingredientPreference.update({
          where: { id: pref.id },
          data: { ingredientId: winnerId },
        });
      }
    }
  }

  // Delete the loser ingredients in a single bulk operation
  console.log(`Deleting ${loserIds.length} duplicate ingredients...`);
  const deleteResult = await prisma.ingredient.deleteMany({
    where: { id: { in: loserIds } },
  });

  console.log(`✅ Duplicates merged and cleaned up. Total ingredients deleted: ${deleteResult.count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
