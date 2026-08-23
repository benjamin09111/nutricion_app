import type { DietMealBlock } from "@/features/diet/components/DietRecipesSection";

export interface AutoCartItem {
  id: string;
  name: string;
  category: string;
  sources: ("dieta" | "plato")[];
}

const DISH_INGREDIENTS_CATEGORY = "Ingredientes de Platos";

/**
 * Normaliza un nombre de ingrediente/alimento para deduplicar
 * (quita tildes, minúsculas, espacios de sobra). Mismo criterio que
 * `normalizeFoodKey` en el módulo /dashboard/carrito, reimplementado aquí
 * porque esa función es local a un componente de otra feature.
 */
export function normalizeIngredientKey(name: string): string {
  return String(name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function splitLegacyIngredientsText(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function collectMealIngredientNames(meal: DietMealBlock): string[] {
  if (Array.isArray(meal.ingredientDetails) && meal.ingredientDetails.length > 0) {
    return meal.ingredientDetails
      .map((ing) => (typeof ing?.name === "string" ? ing.name.trim() : ""))
      .filter(Boolean);
  }
  if (typeof meal.ingredients === "string" && meal.ingredients.trim()) {
    return splitLegacyIngredientsText(meal.ingredients);
  }
  return [];
}

/**
 * Construye la lista automática y deduplicada de ingredientes/alimentos
 * usados en la dieta, combinando los alimentos incluidos en la dieta base
 * y los ingredientes de todos los platos (manuales o generados por IA).
 * No incluye cantidades ni precios: solo presencia y categoría.
 */
export function buildAutoCartItems(
  includedFoods: Array<{ producto: string; grupo: string }>,
  meals: DietMealBlock[],
): AutoCartItem[] {
  const byKey = new Map<string, AutoCartItem>();

  const upsert = (name: string, category: string, source: "dieta" | "plato") => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const key = normalizeIngredientKey(trimmed);
    if (!key) return;

    const existing = byKey.get(key);
    if (existing) {
      if (!existing.sources.includes(source)) existing.sources.push(source);
      return;
    }

    byKey.set(key, {
      id: key,
      name: trimmed,
      category,
      sources: [source],
    });
  };

  (includedFoods || []).forEach((food) => {
    upsert(food?.producto || "", food?.grupo || "Varios", "dieta");
  });

  (meals || []).forEach((meal) => {
    collectMealIngredientNames(meal).forEach((name) => {
      upsert(name, DISH_INGREDIENTS_CATEGORY, "plato");
    });
  });

  return Array.from(byKey.values()).sort((a, b) => {
    if (a.category !== b.category) {
      if (a.category === DISH_INGREDIENTS_CATEGORY) return 1;
      if (b.category === DISH_INGREDIENTS_CATEGORY) return -1;
      return a.category.localeCompare(b.category, "es");
    }
    return a.name.localeCompare(b.name, "es");
  });
}
