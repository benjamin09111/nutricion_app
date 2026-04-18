import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { EstimateMacrosDto } from './dto/estimate-macros.dto';
import { AiFillRecipesDto } from './dto/ai-fill-recipes.dto';
import { CacheService } from '../../common/services/cache.service';
type AiRecipeOutput = {
    slotId: string;
    mealSection: string;
    title: string;
    description: string;
    preparation: string;
    recommendedPortion: string;
    complexity: 'simple' | 'elaborada';
    protein: number;
    calories: number;
    carbs: number;
    fats: number;
    ingredients: string[];
    mainIngredients: string[];
    extraIngredients?: string[];
};
type AiReplacementGuide = {
    mealSection: string;
    suggestions: string[];
};
type AiMetaResponse = {
    note: string;
    replacementGuide: AiReplacementGuide[];
};
type AiFillDayResponse = {
    recipes: AiRecipeOutput[];
    meta: AiMetaResponse;
};
type AiFillWeekResponse = {
    days: Array<{
        day: string;
        recipes: AiRecipeOutput[];
    }>;
    meta: AiMetaResponse;
};
export declare class RecipesService {
    private readonly prisma;
    private readonly cacheService;
    private readonly logger;
    constructor(prisma: PrismaService, cacheService: CacheService);
    private getNutritionistId;
    private normalizeFoodName;
    private normalizeMealSection;
    private isStrictMealSection;
    private buildAiPrompt;
    private getGeminiConfig;
    private extractGeminiText;
    private mapAiErrorMessage;
    private callGeminiJson;
    private extractJsonFromResponse;
    private extractFirstJsonValue;
    private parseAiResponse;
    private validateAiRecipe;
    private validateReplacementGuide;
    private validateWeekVariety;
    fillWithAi(userId: string, dto: AiFillRecipesDto): Promise<AiFillDayResponse | AiFillWeekResponse>;
    create(userId: string, createDto: CreateRecipeDto): Promise<{
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
    } & {
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
    }>;
    findAll(userId: string): Promise<any[]>;
    findOne(id: string, userId: string): Promise<{
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
            id: string;
            fullName: string;
            phone: string | null;
            professionalId: string | null;
            specialty: string | null;
            createdAt: Date;
            updatedAt: Date;
            accountId: string;
            avatarUrl: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
        } | null;
    } & {
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
    }>;
    update(id: string, userId: string, userRole: string, updateDto: CreateRecipeDto): Promise<{
        ingredients: {
            unit: string;
            amount: number;
            id: string;
            brandSuggestion: string | null;
            ingredientId: string;
            isMain: boolean;
            recipeId: string;
        }[];
    } & {
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
    }>;
    estimateMacros(dto: EstimateMacrosDto): Promise<{
        calories: number;
        proteins: number;
        carbs: number;
        lipids: number;
    }>;
    remove(id: string, userId: string, userRole: string): Promise<{
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
    }>;
}
export {};
