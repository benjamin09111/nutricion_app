import type { Ingredient } from "./index";
import rawCatalog from "../../../public/data/ingredients.catalog.json";

export interface RawCatalogItem {
  id: string;
  name: string;
  category: string;
  calories: number;
  proteins: number;
  carbs: number;
  lipids: number;
  sugars: number;
  fiber: number;
  sodium: number;
  unit: string;
  amount: number;
}

export const RAW_CATALOG_ITEMS: RawCatalogItem[] = rawCatalog as RawCatalogItem[];

export const OFFICIAL_INGREDIENTS: Ingredient[] = RAW_CATALOG_ITEMS.map((item) => ({
  id: item.id,
  name: item.name,
  category: {
    id: `cat-${item.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: item.category,
  },
  price: 0,
  unit: item.unit || "g",
  amount: item.amount || 100,
  calories: item.calories ?? 0,
  proteins: item.proteins ?? 0,
  carbs: item.carbs ?? 0,
  lipids: item.lipids ?? 0,
  sugars: item.sugars ?? 0,
  fiber: item.fiber ?? 0,
  sodium: item.sodium ?? 0,
  tags: [],
  isPublic: true,
  verified: true,
  isMine: false,
  isDraft: false,
}));

export interface DietMarketPrice {
  id: string;
  producto: string;
  grupo: string;
  unidad: string;
  precioPromedio: number;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  lipidos: number;
  azucares: number;
  fibra: number;
  sodio: number;
  tags: string[];
  isDraft?: boolean;
}

export const OFFICIAL_MARKET_PRICES: DietMarketPrice[] = OFFICIAL_INGREDIENTS.map((ing) => ({
  id: ing.id,
  producto: ing.name,
  grupo: ing.category?.name || "Varios",
  unidad: ing.unit || "g",
  precioPromedio: ing.price || 0,
  calorias: ing.calories || 0,
  proteinas: ing.proteins || 0,
  carbohidratos: ing.carbs || 0,
  lipidos: ing.lipids || 0,
  azucares: ing.sugars || 0,
  fibra: ing.fiber || 0,
  sodio: ing.sodium || 0,
  tags: [],
  isDraft: false,
}));

export function normalizeSearchText(value: string): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function searchLocalIngredients(
  ingredients: Ingredient[],
  query?: string,
  category?: string,
  limit?: number,
): Ingredient[] {
  let results = ingredients;

  if (category && category !== "Todos" && category !== "Todas") {
    const normCategory = normalizeSearchText(category);
    results = results.filter(
      (item) => normalizeSearchText(item.category?.name || "") === normCategory,
    );
  }

  if (query && query.trim()) {
    const normQuery = normalizeSearchText(query);
    const terms = normQuery.split(/\s+/).filter(Boolean);

    results = results.filter((item) => {
      const normName = normalizeSearchText(item.name);
      return terms.every((term) => normName.includes(term));
    });
  }

  if (typeof limit === "number" && limit > 0) {
    return results.slice(0, limit);
  }

  return results;
}
