import type { DietMealBlock } from "@/features/diet/components/DietRecipesSection";

export interface AutoCartItem {
  id: string;
  name: string;
  category: string;
  sources: ("dieta" | "plato")[];
}

const DISH_INGREDIENTS_CATEGORY = "Ingredientes de Platos";

/**
 * Limpia un nombre de alimento quitando cantidades, unidades de medida,
 * anotaciones "(opcional)", "al gusto", y paréntesis mal cerrados o sueltos.
 */
export function cleanFoodName(rawName: string): string {
  if (!rawName) return "";
  let name = rawName.trim();

  // 1. Quitar anotaciones de (opcional), [opcional], o la palabra suelta opcional / al gusto
  name = name
    .replace(/\s*\(\s*opcional\b[^)]*\)/gi, "")
    .replace(/\s*\[\s*opcional\b[^\]]*\]/gi, "")
    .replace(/\bopcional\b/gi, "")
    .replace(/\s*\(\s*al?\s+gusto\b[^)]*\)/gi, "")
    .replace(/\s*\[\s*al?\s+gusto\b[^\]]*\]/gi, "")
    .replace(/\b(al?|a)\s+gusto\b/gi, "")
    .replace(/\bcantidad\s+necesaria\b/gi, "")
    .replace(/\bcant\.\s*necesaria\b/gi, "");

  // 2. Cantidad numérica al inicio con unidad opcional (requiere número para unidades cortas como l/g/x)
  const numberWithUnitRegex = /^\s*(?:\d+(?:[.,]\d+)?|\d+\/\d+)\s*(?:x|g|gr|gramos|kg|kilos|ml|l|litros?|tazas?|cdas?|cucharadas?|cdtas?|cucharaditas?|unidades?|unidad|unid|unids|porci[oó]n(?:es)?|medidas?|scoops?|rodajas?|fetas?|lonjas?|rebanadas?|dientes?|latas?|paquetes?|pizcas?|trozos?|vasos?|cda\.?|cdta\.?)?\b\s*(?:de\s+|d['’])?\s*/i;
  name = name.replace(numberWithUnitRegex, "").trim();

  // 3. Unidades explícitas en texto sin número antes de la palabra principal
  const standaloneUnitRegex = /^\s*(?:unidades?|unidad\b|unid\b|unids\b|pizcas?|pizca\b)\s+(?:de\s+|d['’])?\s*/i;
  name = name.replace(standaloneUnitRegex, "").trim();

  // 4. Quitar notas de ejemplos como "(ej: fresas" o "(ej. ...)"
  name = name.replace(/\s*\(\s*ej(?:emplo)?\.?:?[^)]*\)?/gi, "").trim();

  // 5. Corregir paréntesis desbalanceados o sueltos
  if (name.includes("(") && !name.includes(")")) {
    name = name.split("(")[0].trim();
  }
  if (name.includes(")") && !name.includes("(")) {
    name = name.replace(/\)+/g, "").trim();
  }

  // Quitar paréntesis vacíos
  name = name.replace(/\(\s*\)/g, "").replace(/\[\s*\]/g, "").trim();

  // Quitar puntuación colgante al final (dos puntos, comas, guiones, puntos)
  name = name.replace(/[:;,.\-\s]+$/, "").trim();

  if (!name) return rawName.trim();

  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Comprueba si dos nombres de alimentos son variantes del mismo alimento principal
 * (ej: "Papa" vs "Papa cocida", "Yogurt natural" vs "Yogurt con Frutas").
 */
export function isSimilarFoodName(a: string, b: string): boolean {
  const keyA = normalizeIngredientKey(cleanFoodName(a));
  const keyB = normalizeIngredientKey(cleanFoodName(b));
  if (!keyA || !keyB) return false;
  if (keyA === keyB) return true;

  const wordsA = keyA.split(/\s+/).filter((w) => w.length >= 3);
  const wordsB = keyB.split(/\s+/).filter((w) => w.length >= 3);

  if (wordsA.length === 0 || wordsB.length === 0) return false;

  // Si comparten la primera palabra principal (ej: "papa" en "papa cocida", "yogurt" en "yogurt natural")
  if (wordsA[0] === wordsB[0]) return true;

  // Si una clave completa contiene a la otra como subcadena (ej: "pollo" en "pechuga de pollo")
  if (keyA.length >= 4 && keyB.length >= 4) {
    if (keyA.includes(keyB) || keyB.includes(keyA)) return true;
  }

  return false;
}

/**
 * Normaliza un nombre de ingrediente/alimento para deduplicar
 * (quita tildes, minúsculas, espacios de sobra).
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
  const items: AutoCartItem[] = [];

  const upsert = (name: string, category: string, source: "dieta" | "plato") => {
    const cleaned = cleanFoodName(name);
    if (!cleaned) return;
    const key = normalizeIngredientKey(cleaned);
    if (!key) return;

    // Buscar si ya existe este ítem o una variante similar
    const existing = items.find(
      (item) => item.id === key || isSimilarFoodName(item.name, cleaned),
    );

    if (existing) {
      if (!existing.sources.includes(source)) existing.sources.push(source);
      return;
    }

    items.push({
      id: key,
      name: cleaned,
      category: cleanFoodName(category) || category,
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

  return items.sort((a, b) => {
    if (a.category !== b.category) {
      if (a.category === DISH_INGREDIENTS_CATEGORY) return 1;
      if (b.category === DISH_INGREDIENTS_CATEGORY) return -1;
      return a.category.localeCompare(b.category, "es");
    }
    return a.name.localeCompare(b.name, "es");
  });
}

