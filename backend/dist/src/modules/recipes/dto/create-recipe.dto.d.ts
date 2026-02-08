declare class RecipeIngredientDto {
    ingredientId: string;
    amount: number;
    unit: string;
    brandSuggestion?: string;
}
export declare class CreateRecipeDto {
    name: string;
    description?: string;
    preparation?: string;
    portions: number;
    portionSize?: number;
    ingredients?: RecipeIngredientDto[];
    calories?: number;
    proteins?: number;
    carbs?: number;
    lipids?: number;
}
export {};
