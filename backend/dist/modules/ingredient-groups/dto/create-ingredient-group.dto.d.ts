export declare class CreateIngredientGroupDto {
    name: string;
    type?: 'INGREDIENT' | 'RECIPE';
    description?: string;
    tags?: string[];
    ingredients?: {
        id: string;
        brandSuggestion?: string;
        amount?: number;
        unit?: string;
    }[];
}
