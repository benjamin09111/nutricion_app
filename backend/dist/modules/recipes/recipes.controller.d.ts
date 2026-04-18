import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { EstimateMacrosDto } from './dto/estimate-macros.dto';
import { CompatibleRecipesDto } from './dto/compatible-recipes.dto';
import { AiFillRecipesDto } from './dto/ai-fill-recipes.dto';
import { RecipeMatchingService } from './recipe-matching.service';
export declare class RecipesController {
    private readonly recipesService;
    private readonly recipeMatchingService;
    constructor(recipesService: RecipesService, recipeMatchingService: RecipeMatchingService);
    create(req: any, createRecipeDto: CreateRecipeDto): Promise<{
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
    estimateMacros(dto: EstimateMacrosDto): Promise<{
        calories: number;
        proteins: number;
        carbs: number;
        lipids: number;
    }>;
    findCompatible(req: any, dto: CompatibleRecipesDto): Promise<{
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
    findAll(req: any): Promise<any[]>;
    findOne(req: any, id: string): Promise<{
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
    update(req: any, id: string, updateRecipeDto: CreateRecipeDto): Promise<{
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
    remove(req: any, id: string): Promise<{
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
