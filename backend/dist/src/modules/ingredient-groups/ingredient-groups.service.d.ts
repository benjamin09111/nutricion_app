import { PrismaService } from '../../prisma/prisma.service';
import { CreateIngredientGroupDto } from './dto/create-ingredient-group.dto';
import { UpdateGroupIngredientsDto } from './dto/update-group-ingredients.dto';
export declare class IngredientGroupsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(nutritionistId: string, createDto: CreateIngredientGroupDto): Promise<{
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
            brandSuggestion: string | null;
            amount: number | null;
            unit: string | null;
            ingredientId: string;
            groupId: string;
        })[];
        tags: {
            id: string;
            name: string;
        }[];
        _count: {
            entries: number;
        };
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string;
    }>;
    findAll(nutritionistId: string): Promise<{
        ingredients: {
            ingredient: {
                preferences: {
                    id: string;
                    nutritionistId: string;
                    ingredientId: string;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    isHidden: boolean;
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
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                nutritionistId: string | null;
                ingredients: string | null;
                amount: number;
                unit: string;
                price: number;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                sugars: number | null;
                fiber: number | null;
                sodium: number | null;
                isPublic: boolean;
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
                    ingredientId: string;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    isHidden: boolean;
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
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                nutritionistId: string | null;
                ingredients: string | null;
                amount: number;
                unit: string;
                price: number;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                sugars: number | null;
                fiber: number | null;
                sodium: number | null;
                isPublic: boolean;
                verified: boolean;
                brandId: string | null;
                categoryId: string;
            };
        } & {
            id: string;
            brandSuggestion: string | null;
            amount: number | null;
            unit: string | null;
            ingredientId: string;
            groupId: string;
        })[];
        tags: {
            id: string;
            name: string;
        }[];
        _count: {
            entries: number;
        };
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string;
    }[]>;
    findOne(id: string, nutritionistId: string): Promise<{
        ingredients: {
            ingredient: {
                tags: {
                    id: string;
                    name: string;
                }[];
                preferences: {
                    id: string;
                    nutritionistId: string;
                    ingredientId: string;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    isHidden: boolean;
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
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                nutritionistId: string | null;
                ingredients: string | null;
                amount: number;
                unit: string;
                price: number;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                sugars: number | null;
                fiber: number | null;
                sodium: number | null;
                isPublic: boolean;
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
                tags: {
                    id: string;
                    name: string;
                }[];
                preferences: {
                    id: string;
                    nutritionistId: string;
                    ingredientId: string;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    isHidden: boolean;
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
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                nutritionistId: string | null;
                ingredients: string | null;
                amount: number;
                unit: string;
                price: number;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                sugars: number | null;
                fiber: number | null;
                sodium: number | null;
                isPublic: boolean;
                verified: boolean;
                brandId: string | null;
                categoryId: string;
            };
        } & {
            id: string;
            brandSuggestion: string | null;
            amount: number | null;
            unit: string | null;
            ingredientId: string;
            groupId: string;
        })[];
        nutritionist: {
            id: string;
        };
        tags: {
            id: string;
            name: string;
        }[];
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string;
    }>;
    private validateGroupOwnership;
    update(id: string, nutritionistId: string, updateDto: CreateIngredientGroupDto): Promise<{
        tags: {
            id: string;
            name: string;
        }[];
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string;
    }>;
    remove(id: string, nutritionistId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string;
    }>;
    addIngredients(id: string, nutritionistId: string, dto: UpdateGroupIngredientsDto): Promise<{
        _count: {
            entries: number;
        };
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string;
    }>;
    removeIngredients(id: string, nutritionistId: string, dto: UpdateGroupIngredientsDto): Promise<{
        _count: {
            entries: number;
        };
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string;
    }>;
    private getOrCreateTag;
}
