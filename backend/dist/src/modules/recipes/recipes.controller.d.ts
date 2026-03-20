import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { EstimateMacrosDto } from './dto/estimate-macros.dto';
export declare class RecipesController {
    private readonly recipesService;
    constructor(recipesService: RecipesService);
    create(req: any, createRecipeDto: CreateRecipeDto): Promise<{
        ingredients: ({
            ingredient: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                nutritionistId: string | null;
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
        nutritionistId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        calories: number;
        proteins: number;
        lipids: number;
        carbs: number;
        fiber: number | null;
        sodium: number | null;
        isPublic: boolean;
        description: string | null;
        preparation: string | null;
        portions: number;
        portionSize: number;
    }>;
    estimateMacros(dto: EstimateMacrosDto): Promise<{
        calories: number;
        proteins: number;
        carbs: number;
        lipids: number;
    }>;
    findAll(req: any): Promise<any[]>;
    findOne(req: any, id: string): Promise<{
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
                nutritionistId: string | null;
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
        nutritionistId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        calories: number;
        proteins: number;
        lipids: number;
        carbs: number;
        fiber: number | null;
        sodium: number | null;
        isPublic: boolean;
        description: string | null;
        preparation: string | null;
        portions: number;
        portionSize: number;
    }>;
    update(req: any, id: string, updateRecipeDto: CreateRecipeDto): Promise<{
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
        nutritionistId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        calories: number;
        proteins: number;
        lipids: number;
        carbs: number;
        fiber: number | null;
        sodium: number | null;
        isPublic: boolean;
        description: string | null;
        preparation: string | null;
        portions: number;
        portionSize: number;
    }>;
    remove(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        calories: number;
        proteins: number;
        lipids: number;
        carbs: number;
        fiber: number | null;
        sodium: number | null;
        isPublic: boolean;
        description: string | null;
        preparation: string | null;
        portions: number;
        portionSize: number;
    }>;
}
