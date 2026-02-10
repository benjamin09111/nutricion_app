import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
export declare class RecipesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getNutritionistId;
    create(userId: string, createDto: CreateRecipeDto): Promise<{
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
        })[];
    } & {
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
        preparation: string | null;
        portions: number;
        portionSize: number;
    })[]>;
    findOne(id: string, userId: string): Promise<{
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
        })[];
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
    } & {
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
        preparation: string | null;
        portions: number;
        portionSize: number;
    }>;
    update(id: string, userId: string, updateDto: CreateRecipeDto): Promise<{
        ingredients: {
            unit: string;
            amount: number;
            id: string;
            brandSuggestion: string | null;
            ingredientId: string;
            recipeId: string;
        }[];
    } & {
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
        preparation: string | null;
        portions: number;
        portionSize: number;
    }>;
    remove(id: string, userId: string): Promise<{
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
        preparation: string | null;
        portions: number;
        portionSize: number;
    }>;
}
