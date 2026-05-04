import { IngredientGroupsService } from './ingredient-groups.service';
import { CreateIngredientGroupDto } from './dto/create-ingredient-group.dto';
import { UpdateGroupIngredientsDto } from './dto/update-group-ingredients.dto';
export declare class IngredientGroupsController {
    private readonly ingredientGroupsService;
    constructor(ingredientGroupsService: IngredientGroupsService);
    create(req: any, createDto: CreateIngredientGroupDto): Promise<{
        entries: ({
            ingredient: {
                id: string;
                brand: {
                    id: string;
                    name: string;
                } | null;
                name: string;
            } | null;
            recipe: {
                id: string;
                name: string;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                portions: number;
                imageUrl: string | null;
            } | null;
        } & {
            id: string;
            unit: string | null;
            amount: number | null;
            brandSuggestion: string | null;
            ingredientId: string | null;
            recipeId: string | null;
            groupId: string;
        })[];
        tags: {
            id: string;
            name: string;
            nutritionistId: string | null;
        }[];
        _count: {
            entries: number;
        };
    } & {
        id: string;
        name: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.IngredientGroupType;
    }>;
    findAll(req: any, type?: string): Promise<{
        ingredients: {
            ingredient: ({
                preferences: {
                    id: string;
                    nutritionistId: string;
                    isHidden: boolean;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    ingredientId: string;
                }[];
                brand: {
                    id: string;
                    name: string;
                } | null;
                category: {
                    id: string;
                    name: string;
                };
            } & {
                ingredients: string | null;
                id: string;
                isPublic: boolean;
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
                nutritionistId: string | null;
                createdAt: Date;
                updatedAt: Date;
                verified: boolean;
                brandId: string | null;
                categoryId: string;
            }) | undefined;
            recipe: {
                id: string;
                isPublic: boolean;
                name: string;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                fiber: number | null;
                sodium: number | null;
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
        entries: ({
            ingredient: ({
                preferences: {
                    id: string;
                    nutritionistId: string;
                    isHidden: boolean;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    ingredientId: string;
                }[];
                brand: {
                    id: string;
                    name: string;
                } | null;
                category: {
                    id: string;
                    name: string;
                };
            } & {
                ingredients: string | null;
                id: string;
                isPublic: boolean;
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
                nutritionistId: string | null;
                createdAt: Date;
                updatedAt: Date;
                verified: boolean;
                brandId: string | null;
                categoryId: string;
            }) | null;
            recipe: {
                id: string;
                isPublic: boolean;
                name: string;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                fiber: number | null;
                sodium: number | null;
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
            id: string;
            unit: string | null;
            amount: number | null;
            brandSuggestion: string | null;
            ingredientId: string | null;
            recipeId: string | null;
            groupId: string;
        })[];
        tags: {
            id: string;
            name: string;
            nutritionistId: string | null;
        }[];
        _count: {
            entries: number;
        };
        id: string;
        name: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.IngredientGroupType;
    }[]>;
    findOne(req: any, id: string): Promise<{
        ingredients: {
            ingredient: ({
                preferences: {
                    id: string;
                    nutritionistId: string;
                    isHidden: boolean;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    ingredientId: string;
                }[];
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
                    nutritionistId: string | null;
                }[];
            } & {
                ingredients: string | null;
                id: string;
                isPublic: boolean;
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
                nutritionistId: string | null;
                createdAt: Date;
                updatedAt: Date;
                verified: boolean;
                brandId: string | null;
                categoryId: string;
            }) | undefined;
            recipe: {
                id: string;
                isPublic: boolean;
                name: string;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                fiber: number | null;
                sodium: number | null;
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
        nutritionist: {
            id: string;
        };
        entries: ({
            ingredient: ({
                preferences: {
                    id: string;
                    nutritionistId: string;
                    isHidden: boolean;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    ingredientId: string;
                }[];
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
                    nutritionistId: string | null;
                }[];
            } & {
                ingredients: string | null;
                id: string;
                isPublic: boolean;
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
                nutritionistId: string | null;
                createdAt: Date;
                updatedAt: Date;
                verified: boolean;
                brandId: string | null;
                categoryId: string;
            }) | null;
            recipe: {
                id: string;
                isPublic: boolean;
                name: string;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                fiber: number | null;
                sodium: number | null;
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
            id: string;
            unit: string | null;
            amount: number | null;
            brandSuggestion: string | null;
            ingredientId: string | null;
            recipeId: string | null;
            groupId: string;
        })[];
        tags: {
            id: string;
            name: string;
            nutritionistId: string | null;
        }[];
        id: string;
        name: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.IngredientGroupType;
    }>;
    update(req: any, id: string, updateDto: CreateIngredientGroupDto): Promise<{
        tags: {
            id: string;
            name: string;
            nutritionistId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.IngredientGroupType;
    }>;
    remove(req: any, id: string): Promise<{
        id: string;
        name: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.IngredientGroupType;
    }>;
    addIngredients(req: any, id: string, dto: UpdateGroupIngredientsDto): Promise<({
        entries: {
            id: string;
            unit: string | null;
            amount: number | null;
            brandSuggestion: string | null;
            ingredientId: string | null;
            recipeId: string | null;
            groupId: string;
        }[];
    } & {
        id: string;
        name: string;
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
        id: string;
        name: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.IngredientGroupType;
    })>;
    removeIngredients(req: any, id: string, dto: UpdateGroupIngredientsDto): Promise<({
        entries: {
            id: string;
            unit: string | null;
            amount: number | null;
            brandSuggestion: string | null;
            ingredientId: string | null;
            recipeId: string | null;
            groupId: string;
        }[];
    } & {
        id: string;
        name: string;
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
        id: string;
        name: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.IngredientGroupType;
    })>;
}
