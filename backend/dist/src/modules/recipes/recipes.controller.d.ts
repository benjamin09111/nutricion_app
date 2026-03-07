import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { EstimateMacrosDto } from './dto/estimate-macros.dto';
export declare class RecipesController {
    private readonly recipesService;
    constructor(recipesService: RecipesService);
    create(req: any, createRecipeDto: CreateRecipeDto): Promise<{
        ingredients: ({
            ingredient: {
                amount: number;
                unit: string;
                name: string;
                ingredients: string | null;
                calories: number;
                proteins: number;
                carbs: number;
                lipids: number;
                isPublic: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                price: number;
                sugars: number | null;
                fiber: number | null;
                sodium: number | null;
                verified: boolean;
                nutritionistId: string | null;
                brandId: string | null;
                categoryId: string;
            };
        } & {
            ingredientId: string;
            amount: number;
            unit: string;
            brandSuggestion: string | null;
            id: string;
            recipeId: string;
        })[];
    } & {
        name: string;
        description: string | null;
        preparation: string | null;
        portions: number;
        portionSize: number;
        calories: number;
        proteins: number;
        carbs: number;
        lipids: number;
        isPublic: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        fiber: number | null;
        sodium: number | null;
        nutritionistId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    estimateMacros(dto: EstimateMacrosDto): Promise<{
        calories: number;
        proteins: number;
        carbs: number;
        lipids: number;
    }>;
    findAll(req: any): Promise<any[]>;
    findOne(req: any, id: string): Promise<{
        ingredients: ({
            ingredient: {
                amount: number;
                unit: string;
                name: string;
                ingredients: string | null;
                calories: number;
                proteins: number;
                carbs: number;
                lipids: number;
                isPublic: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                price: number;
                sugars: number | null;
                fiber: number | null;
                sodium: number | null;
                verified: boolean;
                nutritionistId: string | null;
                brandId: string | null;
                categoryId: string;
            };
        } & {
            ingredientId: string;
            amount: number;
            unit: string;
            brandSuggestion: string | null;
            id: string;
            recipeId: string;
        })[];
        nutritionist: {
            id: string;
            accountId: string;
            fullName: string;
            professionalId: string | null;
            specialty: string | null;
            phone: string | null;
            avatarUrl: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        name: string;
        description: string | null;
        preparation: string | null;
        portions: number;
        portionSize: number;
        calories: number;
        proteins: number;
        carbs: number;
        lipids: number;
        isPublic: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        fiber: number | null;
        sodium: number | null;
        nutritionistId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    update(req: any, id: string, updateRecipeDto: CreateRecipeDto): Promise<{
        ingredients: {
            ingredientId: string;
            amount: number;
            unit: string;
            brandSuggestion: string | null;
            id: string;
            recipeId: string;
        }[];
    } & {
        name: string;
        description: string | null;
        preparation: string | null;
        portions: number;
        portionSize: number;
        calories: number;
        proteins: number;
        carbs: number;
        lipids: number;
        isPublic: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        fiber: number | null;
        sodium: number | null;
        nutritionistId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    remove(req: any, id: string): Promise<{
        name: string;
        description: string | null;
        preparation: string | null;
        portions: number;
        portionSize: number;
        calories: number;
        proteins: number;
        carbs: number;
        lipids: number;
        isPublic: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        fiber: number | null;
        sodium: number | null;
        nutritionistId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
