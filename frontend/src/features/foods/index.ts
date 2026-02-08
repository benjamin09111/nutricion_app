
export interface Ingredient {
    id: string;
    name: string;
    brand?: string;
    price: number;

    // Units
    unit: string;
    amount: number;

    // Nutrition
    calories: number;
    proteins: number;
    lipids: number;
    carbs: number;
    sugars?: number;
    fiber?: number;
    sodium?: number;

    // Meta
    category: string;
    tags: string[];
    ingredients?: string;

    // Origin
    isPublic: boolean;
    verified: boolean;
    nutritionistId?: string | null;

    createdAt?: string;
    updatedAt?: string;
}

// For backward compatibility or specific UI needs
export type IngredientGroup = string;

// Optional: if we need specific types for form creation
export interface CreateIngredientDto extends Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'> { }
