export declare class CreateFoodDto {
    name: string;
    brand?: string;
    category: string;
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
    tags?: string[];
    ingredients?: string;
    micros?: Record<string, any>;
    serving?: Record<string, any>;
    isPublic?: boolean;
}
