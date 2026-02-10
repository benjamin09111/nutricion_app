import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
export declare class RecipesController {
    private readonly recipesService;
    constructor(recipesService: RecipesService);
    create(req: any, createRecipeDto: CreateRecipeDto): Promise<{
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
    findAll(req: any): Promise<({
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
    findOne(req: any, id: string): Promise<{
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
    update(req: any, id: string, updateRecipeDto: CreateRecipeDto): Promise<{
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
    remove(req: any, id: string): Promise<{
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
