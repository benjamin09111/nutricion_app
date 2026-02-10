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
    findAll(req: any): Promise<{
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
    findOne(req: any, id: string): Promise<{
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
    update(req: any, id: string, updateDto: CreateIngredientGroupDto): Promise<{
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
    remove(req: any, id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        nutritionistId: string;
    }>;
    addIngredients(req: any, id: string, dto: UpdateGroupIngredientsDto): Promise<{
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
    removeIngredients(req: any, id: string, dto: UpdateGroupIngredientsDto): Promise<{
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
}
