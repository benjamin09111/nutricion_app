export enum FoodCategory {
  FRUITS = "Frutas",
  VEGETABLES = "Verduras",
  DAIRY = "Lácteos",
  MEATS = "Carnes",
  GRAINS = "Granos",
  PROTEINS = "Proteínas",
  OTHERS = "Otros",
}

export interface Food {
  id: string;
  name: string;
  brand: string | null;
  category: FoodCategory | string; // Allowing string for compatibility with existing DB data
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  serving: any;
}

export type ServingUnit = "g" | "ml" | "un" | "taza" | "cda";
