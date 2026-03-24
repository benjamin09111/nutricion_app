export declare class CreateIngredientGroupDto {
    name: string;
    description?: string;
    tags?: string[];
    ingredients?: {
        id: string;
        brandSuggestion?: string;
        amount?: number;
        unit?: string;
    }[];
}
