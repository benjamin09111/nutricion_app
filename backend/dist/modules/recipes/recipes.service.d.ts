import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { EstimateMacrosDto } from './dto/estimate-macros.dto';
import { AiFillRecipesDto } from './dto/ai-fill-recipes.dto';
import { QuickAiFillRecipesDto } from './dto/quick-ai-fill-recipes.dto';
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
    private sanitizeStringList;
    private parseQuickAiResponse;
    private normalizeQuickDish;
    private buildQuickAiPrompt;
    quickFillWithAi(userId: string, dto: QuickAiFillRecipesDto): Promise<{
        dishes: any;
        meta: {
            note: any;
        };
    }>;
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
            isMain: boolean;
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
            isMain: boolean;
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
    update(id: string, userId: string, userRole: string, updateDto: CreateRecipeDto): Promise<{
        ingredients: {
            id: string;
            amount: number;
            unit: string;
            isMain: boolean;
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
    remove(id: string, userId: string, userRole: string): Promise<{
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
export {};
