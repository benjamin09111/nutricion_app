import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeFoodName } from '../../common/utils/string.util';

@Injectable()
export class RecipeMatchingService {
    constructor(private prisma: PrismaService) {}

    private normalizeList(value: unknown): string[] {
        if (!Array.isArray(value)) return [];
        return Array.from(
            new Set(
                value
                    .map((item) => (typeof item === 'string' ? normalizeFoodName(item) : ''))
                    .filter(Boolean),
            ),
        );
    }

    private getRecipeIngredientNames(recipe: any): string[] {
        const relationNames = Array.isArray(recipe?.ingredients)
            ? recipe.ingredients
                .map((item: any) => item?.ingredient?.name || '')
                .filter(Boolean)
            : [];

        const metadata = (recipe?.metadata as Record<string, any>) || {};
        const customNames = this.normalizeList(metadata.customIngredientNames);
        const customIngredients = Array.isArray(metadata.customIngredients)
            ? metadata.customIngredients
                .map((item: any) => (typeof item?.name === 'string' ? item.name : ''))
                .filter(Boolean)
            : [];
        const rawIngredients = this.normalizeList(metadata.ingredients);

        return Array.from(
            new Set(
                [...relationNames, ...customNames, ...customIngredients, ...rawIngredients]
                    .map((item) => normalizeFoodName(item))
                    .filter(Boolean),
            ),
        );
    }

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

            const relationMainIngredients = Array.isArray(recipe.ingredients)
                ? recipe.ingredients.filter((ri: any) => ri.isMain)
                : [];
            const fallbackIngredientNames = this.getRecipeIngredientNames(recipe);
            const candidateMainIngredients = relationMainIngredients.length > 0
                ? relationMainIngredients.map((ri: any) => normalizeFoodName(ri.ingredient?.name || ''))
                : fallbackIngredientNames;

            if (candidateMainIngredients.length === 0) continue; // Requires at least one ingredient to match
            
            let matchCount = 0;
            for (const recipeIngredient of candidateMainIngredients) {
                const normalizedRecipeReq = normalizeFoodName(recipeIngredient);
                
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

            const matchPercentage = (matchCount / candidateMainIngredients.length) * 100;

            if (matchPercentage >= 80) {
                scoredRecipes.push({
                    recipe,
                    matchPercentage,
                    matchCount,
                    totalMain: candidateMainIngredients.length
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
