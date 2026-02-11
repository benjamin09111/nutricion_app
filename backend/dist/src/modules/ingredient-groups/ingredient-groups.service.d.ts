import { PrismaService } from '../../prisma/prisma.service';
import { CreateIngredientGroupDto } from './dto/create-ingredient-group.dto';
import { UpdateGroupIngredientsDto } from './dto/update-group-ingredients.dto';
export declare class IngredientGroupsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(nutritionistId: string, createDto: CreateIngredientGroupDto): Promise<{
        tags: {
            name: string;
            id: string;
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
            };
        } & {
            unit: string | null;
            amount: number | null;
            id: string;
            brandSuggestion: string | null;
            ingredientId: string;
            groupId: string;
        })[];
    } & {
        name: string;
        id: string;
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
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    isHidden: boolean;
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
            };
            brandSuggestion: string | null;
            amount: number | null;
            unit: string | null;
            entryId: string;
        }[];
        tags: {
            name: string;
            id: string;
        }[];
        _count: {
            entries: number;
        };
        entries: ({
            ingredient: {
                preferences: {
                    id: string;
                    nutritionistId: string;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    isHidden: boolean;
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
            };
        } & {
            unit: string | null;
            amount: number | null;
            id: string;
            brandSuggestion: string | null;
            ingredientId: string;
            groupId: string;
        })[];
        name: string;
        id: string;
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
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    isHidden: boolean;
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
            name: string;
            id: string;
        }[];
        entries: ({
            ingredient: {
                preferences: {
                    id: string;
                    nutritionistId: string;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    isHidden: boolean;
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
            };
        } & {
            unit: string | null;
            amount: number | null;
            id: string;
            brandSuggestion: string | null;
            ingredientId: string;
            groupId: string;
        })[];
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
    }>;
    private validateGroupOwnership;
    update(id: string, nutritionistId: string, updateDto: CreateIngredientGroupDto): Promise<{
        tags: {
            name: string;
            id: string;
        }[];
    } & {
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
    }>;
    remove(id: string, nutritionistId: string): Promise<{
        name: string;
        id: string;
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
        name: string;
        id: string;
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
        name: string;
        id: string;
        nutritionistId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
    }>;
    private getOrCreateTag;
}
