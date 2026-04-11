import { PrismaService } from '../../prisma/prisma.service';
export declare class RecipeMatchingService {
    private prisma;
    constructor(prisma: PrismaService);
    findCompatibleRecipes(nutritionistId: string, ingredientNames: string[], restrictions?: string[]): Promise<{
        matchPercentage: number;
        isMine: boolean;
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
            isMain: boolean;
            recipeId: string;
        })[];
        nutritionist: {
            fullName: string;
        } | null;
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
        portions: number;
        portionSize: number;
        imageUrl: string | null;
    }[]>;
}
