import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { EstimateMacrosDto } from './dto/estimate-macros.dto';
import { CompatibleRecipesDto } from './dto/compatible-recipes.dto';
import { AiFillRecipesDto } from './dto/ai-fill-recipes.dto';
import { QuickAiFillRecipesDto } from './dto/quick-ai-fill-recipes.dto';
import { RecipeMatchingService } from './recipe-matching.service';
export declare class RecipesController {
    private readonly recipesService;
    private readonly recipeMatchingService;
    constructor(recipesService: RecipesService, recipeMatchingService: RecipeMatchingService);
    create(req: any, createRecipeDto: CreateRecipeDto): Promise<{
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
    estimateMacros(dto: EstimateMacrosDto): Promise<{
        calories: number;
        proteins: number;
        carbs: number;
        lipids: number;
    }>;
    findCompatible(req: any, dto: CompatibleRecipesDto): Promise<{
        matchPercentage: number;
        isMine: boolean;
        isAdopted: boolean;
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
        savedBy: {
            id: string;
        }[];
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
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        nutritionistId: string | null;
    }[]>;
    fillWithAi(req: any, dto: AiFillRecipesDto): Promise<{
        recipes: {
            slotId: string;
            mealSection: string;
            title: string;
            description: string;
            preparation: string;
            recommendedPortion: string;
            complexity: "simple" | "elaborada";
            protein: number;
            calories: number;
            carbs: number;
            fats: number;
            ingredients: string[];
            mainIngredients: string[];
            extraIngredients?: string[];
        }[];
        meta: {
            note: string;
            replacementGuide: {
                mealSection: string;
                suggestions: string[];
            }[];
        };
    } | {
        days: Array<{
            day: string;
            recipes: {
                slotId: string;
                mealSection: string;
                title: string;
                description: string;
                preparation: string;
                recommendedPortion: string;
                complexity: "simple" | "elaborada";
                protein: number;
                calories: number;
                carbs: number;
                fats: number;
                ingredients: string[];
                mainIngredients: string[];
                extraIngredients?: string[];
            }[];
        }>;
        meta: {
            note: string;
            replacementGuide: {
                mealSection: string;
                suggestions: string[];
            }[];
        };
    }>;
    fillQuickWithAi(req: any, dto: QuickAiFillRecipesDto): Promise<{
        dishes: any;
        meta: {
            note: any;
        };
    }>;
    addToLibrary(req: any, id: string): Promise<{
        recipeId: string;
        added: boolean;
        alreadyOwned: boolean;
    } | {
        recipeId: string;
        added: boolean;
        alreadyOwned?: undefined;
    }>;
    findAll(req: any): Promise<any[]>;
    findOne(req: any, id: string): Promise<{
        isMine: boolean;
        isAdopted: boolean;
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
        savedBy: {
            id: string;
            createdAt: Date;
            nutritionistId: string;
            recipeId: string;
        }[];
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
    update(req: any, id: string, updateRecipeDto: CreateRecipeDto): Promise<{
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
    remove(req: any, id: string): Promise<{
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
