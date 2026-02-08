import { PrismaService } from '../../prisma/prisma.service';
import { CreateIngredientGroupDto } from './dto/create-ingredient-group.dto';
import { UpdateGroupIngredientsDto } from './dto/update-group-ingredients.dto';
export declare class IngredientGroupsService {
    private prisma;
    constructor(prisma: PrismaService);
    private getNutritionistId;
    create(accountId: string, createDto: CreateIngredientGroupDto): Promise<{
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
    findAll(accountId: string): Promise<({
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
    findOne(id: string, accountId: string): Promise<{
        ingredients: {
            brandSuggestion: string | null;
            amount: number | null;
            unit: string | null;
            entryId: string;
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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            verified: boolean;
            price: number;
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
    update(id: string, accountId: string, updateDto: CreateIngredientGroupDto): Promise<{
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
    remove(id: string, accountId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string;
        description: string | null;
    }>;
    addIngredients(id: string, accountId: string, dto: UpdateGroupIngredientsDto): Promise<{
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
    removeIngredients(id: string, accountId: string, dto: UpdateGroupIngredientsDto): Promise<{
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
    private getOrCreateTag;
}
