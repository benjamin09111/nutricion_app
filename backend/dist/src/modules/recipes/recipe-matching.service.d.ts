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
                verified: boolean;
                name: string;
                price: number;
                unit: string;
                amount: number;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                id: string;
                ingredients: string | null;
                sugars: number | null;
                fiber: number | null;
                sodium: number | null;
                isPublic: boolean;
                nutritionistId: string | null;
                createdAt: Date;
                updatedAt: Date;
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
        id: string;
        fiber: number | null;
        sodium: number | null;
        isPublic: boolean;
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
