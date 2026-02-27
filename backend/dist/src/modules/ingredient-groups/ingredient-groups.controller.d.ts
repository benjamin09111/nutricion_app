import { IngredientGroupsService } from './ingredient-groups.service';
import { CreateIngredientGroupDto } from './dto/create-ingredient-group.dto';
import { UpdateGroupIngredientsDto } from './dto/update-group-ingredients.dto';
export declare class IngredientGroupsController {
    private readonly ingredientGroupsService;
    constructor(ingredientGroupsService: IngredientGroupsService);
    create(req: any, createDto: CreateIngredientGroupDto): Promise<{
        tags: {
            id: string;
            name: string;
            nutritionistId: string | null;
        }[];
        _count: {
            entries: number;
        };
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
            unit: string | null;
            amount: number | null;
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
    findAll(req: any): Promise<{
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
                    id: string;
                    name: string;
                } | null;
                category: {
                    id: string;
                    name: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                nutritionistId: string | null;
                verified: boolean;
                price: number;
                unit: string;
                amount: number;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                ingredients: string | null;
                sugars: number | null;
                fiber: number | null;
                sodium: number | null;
                isPublic: boolean;
                brandId: string | null;
                categoryId: string;
            };
            brandSuggestion: string | null;
            amount: number | null;
            unit: string | null;
            entryId: string;
        }[];
        tags: {
            id: string;
            name: string;
            nutritionistId: string | null;
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
                    id: string;
                    name: string;
                } | null;
                category: {
                    id: string;
                    name: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                nutritionistId: string | null;
                verified: boolean;
                price: number;
                unit: string;
                amount: number;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                ingredients: string | null;
                sugars: number | null;
                fiber: number | null;
                sodium: number | null;
                isPublic: boolean;
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        nutritionistId: string;
        description: string | null;
    }[]>;
    findOne(req: any, id: string): Promise<{
        ingredients: {
            ingredient: {
                tags: {
                    id: string;
                    name: string;
                    nutritionistId: string | null;
                }[];
                preferences: {
                    id: string;
                    nutritionistId: string;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    isHidden: boolean;
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
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                nutritionistId: string | null;
                verified: boolean;
                price: number;
                unit: string;
                amount: number;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                ingredients: string | null;
                sugars: number | null;
                fiber: number | null;
                sodium: number | null;
                isPublic: boolean;
                brandId: string | null;
                categoryId: string;
            };
            brandSuggestion: string | null;
            amount: number | null;
            unit: string | null;
            entryId: string;
        }[];
        tags: {
            id: string;
            name: string;
            nutritionistId: string | null;
        }[];
        nutritionist: {
            id: string;
        };
        entries: ({
            ingredient: {
                tags: {
                    id: string;
                    name: string;
                    nutritionistId: string | null;
                }[];
                preferences: {
                    id: string;
                    nutritionistId: string;
                    isFavorite: boolean;
                    isNotRecommended: boolean;
                    isHidden: boolean;
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
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                nutritionistId: string | null;
                verified: boolean;
                price: number;
                unit: string;
                amount: number;
                calories: number;
                proteins: number;
                lipids: number;
                carbs: number;
                ingredients: string | null;
                sugars: number | null;
                fiber: number | null;
                sodium: number | null;
                isPublic: boolean;
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
            nutritionistId: string | null;
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
