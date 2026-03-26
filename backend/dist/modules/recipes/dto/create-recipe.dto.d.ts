declare class RecipeIngredientDto {
    ingredientId: string;
    amount: number;
    unit: string;
    brandSuggestion?: string;
}
declare class CustomIngredientDto {
    name: string;
    amount: number;
    unit: string;
}
export declare class CreateRecipeDto {
    name: string;
    description?: string;
    preparation?: string;
    portions?: number;
    portionSize?: number;
    ingredients?: RecipeIngredientDto[];
    calories?: number;
    proteins?: number;
    carbs?: number;
    lipids?: number;
    fiber?: number;
    sodium?: number;
    isPublic?: boolean;
    tags?: string[];
    mealSection?: string;
    imageUrl?: string;
    customIngredientNames?: string[];
    customIngredients?: CustomIngredientDto[];
}
export {};
