import { PrismaService } from '../../prisma/prisma.service';
export declare class RecipeMatchingService {
    private prisma;
    constructor(prisma: PrismaService);
    private normalizeList;
    private getRecipeIngredientNames;
    findCompatibleRecipes(nutritionistId: string, ingredientNames: string[], restrictions?: string[]): Promise<{
        matchPercentage: number;
        isMine: boolean;
        isAdopted: boolean;
        ingredients: ({
            ingredient: {
                name: string;
                price: number;
                unit: string;
                amount: number;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                sugars: number | null;
                fiber: number | null;
                sodium: number | null;
                ingredients: string | null;
                isPublic: boolean;
                id: string;
                nutritionistId: string | null;
                createdAt: Date;
                updatedAt: Date;
                verified: boolean;
                brandId: string | null;
                categoryId: string;
            };
        } & {
            unit: string;
            amount: number;
            id: string;
            brandSuggestion: string | null;
            ingredientId: string;
            recipeId: string;
            isMain: boolean;
        })[];
        nutritionist: {
            fullName: string;
        } | null;
        savedBy: {
            id: string;
        }[];
        name: string;
        calories: number;
        proteins: number;
        lipids: number;
        carbs: number;
        fiber: number | null;
        sodium: number | null;
        isPublic: boolean;
        id: string;
        nutritionistId: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        preparation: string | null;
        portionSize: number;
        portions: number;
        imageUrl: string | null;
    }[]>;
}
