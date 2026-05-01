import { IngredientGroupsService } from './ingredient-groups.service';
import { CreateIngredientGroupDto } from './dto/create-ingredient-group.dto';
import { UpdateGroupIngredientsDto } from './dto/update-group-ingredients.dto';
export declare class IngredientGroupsController {
    private readonly ingredientGroupsService;
    constructor(ingredientGroupsService: IngredientGroupsService);
    create(req: any, createDto: CreateIngredientGroupDto): Promise<{
        tags: {
            name: string;
            id: string;
            nutritionistId: string | null;
        }[];
        entries: ({
            ingredient: {
                name: string;
                brand: {
                    name: string;
                    id: string;
                } | null;
                id: string;
            } | null;
            recipe: {
                name: string;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                id: string;
                portions: number;
                imageUrl: string | null;
            } | null;
        } & {
            unit: string | null;
            amount: number | null;
            id: string;
            brandSuggestion: string | null;
            ingredientId: string | null;
            recipeId: string | null;
            groupId: string;
        })[];
        _count: {
            entries: number;
        };
    } & {
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.IngredientGroupType;
    }>;
    findAll(req: any, type?: string): Promise<{
        ingredients: {
            ingredient: ({
                brand: {
                    name: string;
                    id: string;
                } | null;
                category: {
                    name: string;
                    id: string;
                };
                preferences: {
                    id: string;
                    nutritionistId: string;
                    isHidden: boolean;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    ingredientId: string;
                }[];
            } & {
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
            }) | undefined;
            recipe: {
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
                portionSize: number;
                portions: number;
                imageUrl: string | null;
            } | undefined;
            brandSuggestion: string | null;
            amount: number | null;
            unit: string | null;
            entryId: string;
        }[];
        tags: {
            name: string;
            id: string;
            nutritionistId: string | null;
        }[];
        entries: ({
            ingredient: ({
                brand: {
                    name: string;
                    id: string;
                } | null;
                category: {
                    name: string;
                    id: string;
                };
                preferences: {
                    id: string;
                    nutritionistId: string;
                    isHidden: boolean;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    ingredientId: string;
                }[];
            } & {
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
            }) | null;
            recipe: {
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
                portionSize: number;
                portions: number;
                imageUrl: string | null;
            } | null;
        } & {
            unit: string | null;
            amount: number | null;
            id: string;
            brandSuggestion: string | null;
            ingredientId: string | null;
            recipeId: string | null;
            groupId: string;
        })[];
        _count: {
            entries: number;
        };
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.IngredientGroupType;
    }[]>;
    findOne(req: any, id: string): Promise<{
        ingredients: {
            ingredient: ({
                brand: {
                    name: string;
                    id: string;
                } | null;
                category: {
                    name: string;
                    id: string;
                };
                tags: {
                    name: string;
                    id: string;
                    nutritionistId: string | null;
                }[];
                preferences: {
                    id: string;
                    nutritionistId: string;
                    isHidden: boolean;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    ingredientId: string;
                }[];
            } & {
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
            }) | undefined;
            recipe: {
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
                portionSize: number;
                portions: number;
                imageUrl: string | null;
            } | undefined;
            brandSuggestion: string | null;
            amount: number | null;
            unit: string | null;
            entryId: string;
        }[];
        tags: {
            name: string;
            id: string;
            nutritionistId: string | null;
        }[];
        nutritionist: {
            id: string;
        };
        entries: ({
            ingredient: ({
                brand: {
                    name: string;
                    id: string;
                } | null;
                category: {
                    name: string;
                    id: string;
                };
                tags: {
                    name: string;
                    id: string;
                    nutritionistId: string | null;
                }[];
                preferences: {
                    id: string;
                    nutritionistId: string;
                    isHidden: boolean;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    ingredientId: string;
                }[];
            } & {
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
            }) | null;
            recipe: {
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
                portionSize: number;
                portions: number;
                imageUrl: string | null;
            } | null;
        } & {
            unit: string | null;
            amount: number | null;
            id: string;
            brandSuggestion: string | null;
            ingredientId: string | null;
            recipeId: string | null;
            groupId: string;
        })[];
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.IngredientGroupType;
    }>;
    update(req: any, id: string, updateDto: CreateIngredientGroupDto): Promise<{
        tags: {
            name: string;
            id: string;
            nutritionistId: string | null;
        }[];
    } & {
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.IngredientGroupType;
    }>;
    remove(req: any, id: string): Promise<{
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.IngredientGroupType;
    }>;
    addIngredients(req: any, id: string, dto: UpdateGroupIngredientsDto): Promise<({
        entries: {
            unit: string | null;
            amount: number | null;
            id: string;
            brandSuggestion: string | null;
            ingredientId: string | null;
            recipeId: string | null;
            groupId: string;
        }[];
    } & {
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.IngredientGroupType;
    }) | ({
        _count: {
            entries: number;
        };
    } & {
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.IngredientGroupType;
    })>;
    removeIngredients(req: any, id: string, dto: UpdateGroupIngredientsDto): Promise<({
        entries: {
            unit: string | null;
            amount: number | null;
            id: string;
            brandSuggestion: string | null;
            ingredientId: string | null;
            recipeId: string | null;
            groupId: string;
        }[];
    } & {
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.IngredientGroupType;
    }) | ({
        _count: {
            entries: number;
        };
    } & {
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.IngredientGroupType;
    })>;
}
