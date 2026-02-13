import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
export declare class RecipesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getNutritionistId;
    create(userId: string, createDto: CreateRecipeDto): Promise<{
        ingredients: ({
            ingredient: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                verified: boolean;
                price: number;
                unit: string;
                amount: number;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                ingredients: string | null;
                sugars: number | null;
                fiber: number | null;
                sodium: number | null;
                isPublic: boolean;
                nutritionistId: string | null;
                brandId: string | null;
                categoryId: string;
            };
        } & {
            id: string;
            unit: string;
            amount: number;
            brandSuggestion: string | null;
            ingredientId: string;
            recipeId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        calories: number;
        proteins: number;
        lipids: number;
        carbs: number;
        fiber: number | null;
        sodium: number | null;
        isPublic: boolean;
        nutritionistId: string | null;
        description: string | null;
        preparation: string | null;
        portions: number;
        portionSize: number;
    }>;
    findAll(userId: string): Promise<({
        nutritionist: {
            fullName: string;
        } | null;
        _count: {
            ingredients: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        calories: number;
        proteins: number;
        lipids: number;
        carbs: number;
        fiber: number | null;
        sodium: number | null;
        isPublic: boolean;
        nutritionistId: string | null;
        description: string | null;
        preparation: string | null;
        portions: number;
        portionSize: number;
    })[]>;
    findOne(id: string, userId: string): Promise<{
        nutritionist: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            accountId: string;
            fullName: string;
            professionalId: string | null;
            specialty: string | null;
            phone: string | null;
            avatarUrl: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
        } | null;
        ingredients: ({
            ingredient: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                verified: boolean;
                price: number;
                unit: string;
                amount: number;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                ingredients: string | null;
                sugars: number | null;
                fiber: number | null;
                sodium: number | null;
                isPublic: boolean;
                nutritionistId: string | null;
                brandId: string | null;
                categoryId: string;
            };
        } & {
            id: string;
            unit: string;
            amount: number;
            brandSuggestion: string | null;
            ingredientId: string;
            recipeId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        calories: number;
        proteins: number;
        lipids: number;
        carbs: number;
        fiber: number | null;
        sodium: number | null;
        isPublic: boolean;
        nutritionistId: string | null;
        description: string | null;
        preparation: string | null;
        portions: number;
        portionSize: number;
    }>;
    update(id: string, userId: string, updateDto: CreateRecipeDto): Promise<{
        ingredients: {
            id: string;
            unit: string;
            amount: number;
            brandSuggestion: string | null;
            ingredientId: string;
            recipeId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        calories: number;
        proteins: number;
        lipids: number;
        carbs: number;
        fiber: number | null;
        sodium: number | null;
        isPublic: boolean;
        nutritionistId: string | null;
        description: string | null;
        preparation: string | null;
        portions: number;
        portionSize: number;
    }>;
    remove(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        calories: number;
        proteins: number;
        lipids: number;
        carbs: number;
        fiber: number | null;
        sodium: number | null;
        isPublic: boolean;
        nutritionistId: string | null;
        description: string | null;
        preparation: string | null;
        portions: number;
        portionSize: number;
    }>;
}
