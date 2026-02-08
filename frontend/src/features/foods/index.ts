
export interface Ingredient {
    id: string;
    name: string;
    brand?: {
        id: string;
        name: string;
    };
    category: {
        id: string;
        name: string;
    };
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
    tags: {
        id: string;
        name: string;
    }[];
    ingredients?: string;

    // Origin
    isPublic: boolean;
    verified: boolean;
    nutritionistId?: string | null;

    // Personalization
    preferences?: {
        isFavorite: boolean;
        isNotRecommended: boolean;
        tags: { id: string, name: string }[];
    }[];

    createdAt?: string;
    updatedAt?: string;
}

// For backward compatibility or specific UI needs
export type IngredientGroup = string;

// Optional: if we need specific types for form creation
export interface CreateIngredientDto extends Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'> { }

export interface MarketPrice {
    id: string;
    producto: string;
    precioPromedio: number;
    precioMinimo?: number;
    precioMaximo?: number;
    unidad: string;
    grupo: string;
    region?: string;
    sector?: string;
    tipoPuntoMonitoreo?: string;
    anio?: string;
    mes?: string;
    semana?: string;
    fechaInicio?: string;
    fechaTermino?: string;
    calorias?: number;
    proteinas?: number;
    tags?: string[];
}

export enum FoodGroup {
    BOVINA = 'Carne Bovina',
    CERDO_AVE_CORDERO = 'Cerdo, Ave y Cordero',
    VEGETALES = 'Vegetales',
    FRUTAS = 'Frutas',
    LACTEOS = 'Lácteos',
    VARIOS = 'Varios'
}
