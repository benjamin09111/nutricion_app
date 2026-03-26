import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { EstimateMacrosDto } from './dto/estimate-macros.dto';
import { CacheService } from '../../common/services/cache.service';
export declare class RecipesService {
    private readonly prisma;
    private readonly cacheService;
    constructor(prisma: PrismaService, cacheService: CacheService);
    private getNutritionistId;
    create(userId: string, createDto: CreateRecipeDto): Promise<{
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
                createdAt: Date;
                updatedAt: Date;
                ingredients: string | null;
                nutritionistId: string | null;
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
            amount: number;
            unit: string;
            brandSuggestion: string | null;
            ingredientId: string;
            recipeId: string;
        })[];
    } & {
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
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        nutritionistId: string | null;
    }>;
    findAll(userId: string): Promise<any[]>;
    findOne(id: string, userId: string): Promise<{
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
                createdAt: Date;
                updatedAt: Date;
                ingredients: string | null;
                nutritionistId: string | null;
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
            amount: number;
            unit: string;
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
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        nutritionistId: string | null;
    }>;
    update(id: string, userId: string, updateDto: CreateRecipeDto): Promise<{
        ingredients: {
            id: string;
            amount: number;
            unit: string;
            brandSuggestion: string | null;
            ingredientId: string;
            recipeId: string;
        }[];
    } & {
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
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        nutritionistId: string | null;
    }>;
    estimateMacros(dto: EstimateMacrosDto): Promise<{
        calories: number;
        proteins: number;
        carbs: number;
        lipids: number;
    }>;
    remove(id: string, userId: string): Promise<{
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
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        nutritionistId: string | null;
    }>;
}
