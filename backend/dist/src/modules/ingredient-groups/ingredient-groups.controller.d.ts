import { IngredientGroupsService } from './ingredient-groups.service';
import { CreateIngredientGroupDto } from './dto/create-ingredient-group.dto';
import { UpdateGroupIngredientsDto } from './dto/update-group-ingredients.dto';
export declare class IngredientGroupsController {
    private readonly ingredientGroupsService;
    constructor(ingredientGroupsService: IngredientGroupsService);
    create(req: any, createDto: CreateIngredientGroupDto): Promise<{
        _count: {
            entries: number;
        };
        tags: {
            id: string;
            name: string;
        }[];
        entries: ({
            ingredient: {
                id: string;
                name: string;
                brand: {
                    id: string;
                    name: string;
                } | null;
            };
        } & {
            id: string;
            amount: number | null;
            unit: string | null;
            brandSuggestion: string | null;
            ingredientId: string;
            groupId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string;
        description: string | null;
    }>;
    findAll(req: any): Promise<({
        _count: {
            entries: number;
        };
        tags: {
            id: string;
            name: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string;
        description: string | null;
    })[]>;
    findOne(req: any, id: string): Promise<{
        ingredients: {
            ingredient: {
                brand: {
                    id: string;
                    name: string;
                } | null;
                category: {
                    id: string;
                    name: string;
                };
                tags: {
                    id: string;
                    name: string;
                }[];
                preferences: {
                    id: string;
                    nutritionistId: string;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    isHidden: boolean;
                    ingredientId: string;
                }[];
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                amount: number;
                name: string;
                verified: boolean;
                price: number;
                unit: string;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                ingredients: string | null;
                brandId: string | null;
                sugars: number | null;
                fiber: number | null;
                sodium: number | null;
                categoryId: string;
                isPublic: boolean;
                nutritionistId: string | null;
            };
            brandSuggestion: string | null;
            amount: number | null;
            unit: string | null;
            entryId: string;
        }[];
        nutritionist: {
            id: string;
        };
        tags: {
            id: string;
            name: string;
        }[];
        entries: ({
            ingredient: {
                brand: {
                    id: string;
                    name: string;
                } | null;
                category: {
                    id: string;
                    name: string;
                };
                tags: {
                    id: string;
                    name: string;
                }[];
                preferences: {
                    id: string;
                    nutritionistId: string;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    isHidden: boolean;
                    ingredientId: string;
                }[];
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                amount: number;
                name: string;
                verified: boolean;
                price: number;
                unit: string;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                ingredients: string | null;
                brandId: string | null;
                sugars: number | null;
                fiber: number | null;
                sodium: number | null;
                categoryId: string;
                isPublic: boolean;
                nutritionistId: string | null;
            };
        } & {
            id: string;
            amount: number | null;
            unit: string | null;
            brandSuggestion: string | null;
            ingredientId: string;
            groupId: string;
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string;
        description: string | null;
    }>;
    update(req: any, id: string, updateDto: CreateIngredientGroupDto): Promise<{
        tags: {
            id: string;
            name: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string;
        description: string | null;
    }>;
    remove(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string;
        description: string | null;
    }>;
    addIngredients(req: any, id: string, dto: UpdateGroupIngredientsDto): Promise<{
        _count: {
            entries: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string;
        description: string | null;
    }>;
    removeIngredients(req: any, id: string, dto: UpdateGroupIngredientsDto): Promise<{
        _count: {
            entries: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string;
        description: string | null;
    }>;
}
