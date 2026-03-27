import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeFoodName } from '../../common/utils/string.util';

@Injectable()
export class RecipeMatchingService {
    constructor(private prisma: PrismaService) {}

    async findCompatibleRecipes(
        nutritionistId: string,
        ingredientNames: string[],
        restrictions: string[] = []
    ) {
        const normalizedInput = Array.from(new Set(ingredientNames.map(n => normalizeFoodName(n)).filter(Boolean)));

        if (normalizedInput.length === 0) return [];

        // Get all candidate recipes
        const recipes = await this.prisma.recipe.findMany({
            where: {
                OR: [
                    { isPublic: true },
                    { nutritionistId }
                ]
            },
            include: {
                ingredients: {
                    include: { ingredient: true }
                },
                nutritionist: { select: { fullName: true } }
            }
        });

        const scoredRecipes = [];

        for (const recipe of recipes) {
            // Check restrictions
            let meetsRestrictions = true;
            const metaTags = (recipe.metadata as any)?.tags || [];
            if (restrictions && restrictions.length > 0) {
                // If the user requested restrictions, the recipe MUST have them as tags
                const recipeTags = metaTags.map((t: string) => normalizeFoodName(t));
                for (const rest of restrictions) {
                    const normalizedRest = normalizeFoodName(rest);
                    if (!recipeTags.includes(normalizedRest)) {
                        meetsRestrictions = false;
                        break;
                    }
                }
            }

            if (!meetsRestrictions) continue;

            const mainIngredients = recipe.ingredients.filter(ri => ri.isMain);
            if (mainIngredients.length === 0) continue; // Requires at least one main ingredient to match
            
            let matchCount = 0;
            for (const ri of mainIngredients) {
                const normalizedRecipeReq = normalizeFoodName(ri.ingredient.name);
                
                let hasMatch = false;
                for (const input of normalizedInput) {
                    if (input === normalizedRecipeReq || input.includes(normalizedRecipeReq) || normalizedRecipeReq.includes(input)) {
                        hasMatch = true;
                        break;
                    }
                }
                if (hasMatch) {
                    matchCount++;
                }
            }

            const matchPercentage = (matchCount / mainIngredients.length) * 100;

            if (matchPercentage >= 80) {
                scoredRecipes.push({
                    recipe,
                    matchPercentage,
                    matchCount,
                    totalMain: mainIngredients.length
                });
            }
        }

        // Sort descending by match percentage, then total main ingredients
        return scoredRecipes
            .sort((a, b) => {
                if (b.matchPercentage !== a.matchPercentage) return b.matchPercentage - a.matchPercentage;
                return b.totalMain - a.totalMain;
            })
            .map(sr => ({
                ...sr.recipe,
                matchPercentage: Math.round(sr.matchPercentage),
                isMine: sr.recipe.nutritionistId === nutritionistId
            }));
    }
}
