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
        nutritionist: {
            fullName: string;
        } | null;
        ingredients: ({
            ingredient: {
                ingredients: string | null;
                id: string;
                isPublic: boolean;
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
                nutritionistId: string | null;
                createdAt: Date;
                updatedAt: Date;
                verified: boolean;
                brandId: string | null;
                categoryId: string;
            };
        } & {
            id: string;
            unit: string;
            amount: number;
            brandSuggestion: string | null;
            ingredientId: string;
            isMain: boolean;
            recipeId: string;
        })[];
        savedBy: {
            id: string;
        }[];
        id: string;
        isPublic: boolean;
        name: string;
        calories: number;
        proteins: number;
        lipids: number;
        carbs: number;
        fiber: number | null;
        sodium: number | null;
        nutritionistId: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        preparation: string | null;
        portions: number;
        portionSize: number;
        imageUrl: string | null;
    }[]>;
}
