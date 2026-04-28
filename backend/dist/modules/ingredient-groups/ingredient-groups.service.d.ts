import { PrismaService } from '../../prisma/prisma.service';
import { CreateIngredientGroupDto } from './dto/create-ingredient-group.dto';
import { UpdateGroupIngredientsDto } from './dto/update-group-ingredients.dto';
import { CacheService } from '../../common/services/cache.service';
export declare class IngredientGroupsService {
    private prisma;
    private cacheService;
    constructor(prisma: PrismaService, cacheService: CacheService);
    create(nutritionistId: string, createDto: CreateIngredientGroupDto): Promise<{
        entries: ({
            ingredient: {
                id: string;
                brand: {
                    id: string;
                    name: string;
                } | null;
                name: string;
            };
        } & {
            id: string;
            unit: string | null;
            amount: number | null;
            brandSuggestion: string | null;
            ingredientId: string;
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
    }>;
    findAll(nutritionistId: string): Promise<{
        ingredients: {
            ingredient: {
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
            };
            brandSuggestion: string | null;
            amount: number | null;
            unit: string | null;
            entryId: string;
        }[];
        entries: ({
            ingredient: {
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
            };
        } & {
            id: string;
            unit: string | null;
            amount: number | null;
            brandSuggestion: string | null;
            ingredientId: string;
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
    }[]>;
    findOne(id: string, nutritionistId: string): Promise<{
        ingredients: {
            ingredient: {
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
            };
            brandSuggestion: string | null;
            amount: number | null;
            unit: string | null;
            entryId: string;
        }[];
        nutritionist: {
            id: string;
        };
        entries: ({
            ingredient: {
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
            };
        } & {
            id: string;
            unit: string | null;
            amount: number | null;
            brandSuggestion: string | null;
            ingredientId: string;
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
    }>;
    private validateGroupOwnership;
    update(id: string, nutritionistId: string, updateDto: CreateIngredientGroupDto): Promise<{
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
    }>;
    remove(id: string, nutritionistId: string): Promise<{
        id: string;
        name: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
    }>;
    addIngredients(id: string, nutritionistId: string, dto: UpdateGroupIngredientsDto): Promise<{
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
    }>;
    removeIngredients(id: string, nutritionistId: string, dto: UpdateGroupIngredientsDto): Promise<{
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
    }>;
    private getOrCreateTag;
}
