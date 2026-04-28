import { PrismaService } from '../../prisma/prisma.service';
export declare class RecipeMatchingService {
    private prisma;
    constructor(prisma: PrismaService);
    private normalizeList;
    private getRecipeIngredientNames;
    findCompatibleRecipes(nutritionistId: string, ingredientNames: string[], restrictions?: string[]): Promise<{
        matchPercentage: number;
        isMine: boolean;
        ingredients: ({
            ingredient: {
                id: string;
                name: string;
                calories: number;
                proteins: number;
                carbs: number;
                lipids: number;
                fiber: number | null;
                sodium: number | null;
                isPublic: boolean;
                nutritionistId: string | null;
                createdAt: Date;
                updatedAt: Date;
                ingredients: string | null;
                amount: number;
                unit: string;
                price: number;
                sugars: number | null;
                verified: boolean;
                brandId: string | null;
                categoryId: string;
            };
        } & {
            id: string;
            recipeId: string;
            ingredientId: string;
            amount: number;
            unit: string;
            isMain: boolean;
            brandSuggestion: string | null;
        })[];
        nutritionist: {
            fullName: string;
        } | null;
        id: string;
        name: string;
        description: string | null;
        preparation: string | null;
        portionSize: number;
        portions: number;
        calories: number;
        proteins: number;
        carbs: number;
        lipids: number;
        fiber: number | null;
        sodium: number | null;
        isPublic: boolean;
        nutritionistId: string | null;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
}
