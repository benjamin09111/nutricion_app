import { IngredientGroupsService } from './ingredient-groups.service';
import { CreateIngredientGroupDto } from './dto/create-ingredient-group.dto';
import { UpdateGroupIngredientsDto } from './dto/update-group-ingredients.dto';
export declare class IngredientGroupsController {
    private readonly ingredientGroupsService;
    constructor(ingredientGroupsService: IngredientGroupsService);
    create(req: any, createDto: CreateIngredientGroupDto): Promise<{
        tags: {
            name: string;
            nutritionistId: string | null;
            id: string;
        }[];
        entries: ({
            ingredient: {
                name: string;
                brand: {
                    name: string;
                    id: string;
                } | null;
                id: string;
            };
        } & {
            unit: string | null;
            amount: number | null;
            id: string;
            brandSuggestion: string | null;
            ingredientId: string;
            groupId: string;
        })[];
        _count: {
            entries: number;
        };
    } & {
        name: string;
        nutritionistId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
    }>;
    findAll(req: any): Promise<{
        ingredients: {
            ingredient: {
                brand: {
                    name: string;
                    id: string;
                } | null;
                category: {
                    name: string;
                    id: string;
                };
                preferences: {
                    nutritionistId: string;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    isHidden: boolean;
                    id: string;
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
                nutritionistId: string | null;
                id: string;
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
        tags: {
            name: string;
            nutritionistId: string | null;
            id: string;
        }[];
        entries: ({
            ingredient: {
                brand: {
                    name: string;
                    id: string;
                } | null;
                category: {
                    name: string;
                    id: string;
                };
                preferences: {
                    nutritionistId: string;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    isHidden: boolean;
                    id: string;
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
                nutritionistId: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                verified: boolean;
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
        _count: {
            entries: number;
        };
        name: string;
        nutritionistId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
    }[]>;
    findOne(req: any, id: string): Promise<{
        ingredients: {
            ingredient: {
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
                    nutritionistId: string | null;
                    id: string;
                }[];
                preferences: {
                    nutritionistId: string;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    isHidden: boolean;
                    id: string;
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
                nutritionistId: string | null;
                id: string;
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
        tags: {
            name: string;
            nutritionistId: string | null;
            id: string;
        }[];
        nutritionist: {
            id: string;
        };
        entries: ({
            ingredient: {
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
                    nutritionistId: string | null;
                    id: string;
                }[];
                preferences: {
                    nutritionistId: string;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    isHidden: boolean;
                    id: string;
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
                nutritionistId: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                verified: boolean;
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
        nutritionistId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
    }>;
    update(req: any, id: string, updateDto: CreateIngredientGroupDto): Promise<{
        tags: {
            name: string;
            nutritionistId: string | null;
            id: string;
        }[];
    } & {
        name: string;
        nutritionistId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
    }>;
    remove(req: any, id: string): Promise<{
        name: string;
        nutritionistId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
    }>;
    addIngredients(req: any, id: string, dto: UpdateGroupIngredientsDto): Promise<{
        _count: {
            entries: number;
        };
    } & {
        name: string;
        nutritionistId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
    }>;
    removeIngredients(req: any, id: string, dto: UpdateGroupIngredientsDto): Promise<{
        _count: {
            entries: number;
        };
    } & {
        name: string;
        nutritionistId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
    }>;
}
