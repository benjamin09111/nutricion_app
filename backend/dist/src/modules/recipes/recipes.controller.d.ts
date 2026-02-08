import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
export declare class RecipesController {
    private readonly recipesService;
    constructor(recipesService: RecipesService);
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
                brandId: string | null;
                price: number;
                sugars: number | null;
                categoryId: string;
                verified: boolean;
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
        nutritionistId: string | null;
    }>;
    findAll(req: any): Promise<({
        nutritionist: {
            fullName: string;
        } | null;
        _count: {
            ingredients: number;
        };
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
        nutritionistId: string | null;
    })[]>;
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
                brandId: string | null;
                price: number;
                sugars: number | null;
                categoryId: string;
                verified: boolean;
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
        nutritionistId: string | null;
    }>;
    update(req: any, id: string, updateRecipeDto: CreateRecipeDto): Promise<{
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
        nutritionistId: string | null;
    }>;
}
