import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIngredientGroupDto } from './dto/create-ingredient-group.dto';
import { UpdateGroupIngredientsDto } from './dto/update-group-ingredients.dto';
import { CacheService } from '../../common/services/cache.service';
export declare class IngredientGroupsService {
    private prisma;
    private cacheService;
    constructor(prisma: PrismaService, cacheService: CacheService);
    create(nutritionistId: string, createDto: CreateIngredientGroupDto): Promise<{
        tags: {
            name: string;
            id: string;
            nutritionistId: string | null;
        }[];
        _count: {
            entries: number;
        };
        entries: ({
            ingredient: {
                name: string;
                id: string;
                brand: {
                    name: string;
                    id: string;
                } | null;
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
    } & {
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.IngredientGroupType;
    }>;
    findAll(nutritionistId: string, type?: string): Promise<{
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
                    name: string;
                    id: string;
                } | null;
                category: {
                    name: string;
                    id: string;
                };
            } & {
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
            }) | undefined;
            recipe: {
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
                metadata: Prisma.JsonValue | null;
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
        _count: {
            entries: number;
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
                    name: string;
                    id: string;
                } | null;
                category: {
                    name: string;
                    id: string;
                };
            } & {
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
            }) | null;
            recipe: {
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
                metadata: Prisma.JsonValue | null;
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
    }[]>;
    findOne(id: string, nutritionistId: string): Promise<{
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
            } & {
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
            }) | undefined;
            recipe: {
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
                metadata: Prisma.JsonValue | null;
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
        tags: {
            name: string;
            id: string;
            nutritionistId: string | null;
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
            } & {
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
            }) | null;
            recipe: {
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
                metadata: Prisma.JsonValue | null;
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
    private validateGroupOwnership;
    update(id: string, nutritionistId: string, updateDto: CreateIngredientGroupDto): Promise<{
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
    remove(id: string, nutritionistId: string): Promise<{
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.IngredientGroupType;
    }>;
    addIngredients(id: string, nutritionistId: string, dto: UpdateGroupIngredientsDto): Promise<({
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
    removeIngredients(id: string, nutritionistId: string, dto: UpdateGroupIngredientsDto): Promise<({
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
    private getOrCreateTag;
}
