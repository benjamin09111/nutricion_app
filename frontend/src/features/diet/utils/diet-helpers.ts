import { DEFAULT_CONSTRAINTS } from "@/lib/constants";
import { MarketPrice } from "@/features/foods";
import { getCurrentUser } from "@/lib/current-user";

export interface RestrictionConflict {
  foodId: string;
  foodName: string;
  restriction: string;
  reason: string;
  severity: "low" | "medium" | "high";
}

export interface DietVerificationResult {
  ok: boolean;
  source: "openai" | "heuristic";
  checkedFoods: number;
  checkedRestrictions: number;
  conflicts: RestrictionConflict[];
  safeFoods: string[];
  summary: string;
}

export interface DietPatient {
  id?: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  documentId?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  dietRestrictions?: string[];
  clinicalSummary?: string | null;
  customVariables?: unknown;
  fitnessGoals?: string | null;
  nutritionalFocus?: string | null;
  status?: string | null;
  tags?: string[];
  consultations?: any[];
  exams?: any[];
  [key: string]: unknown;
}

export const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue) return [];

    try {
      const parsedValue = JSON.parse(trimmedValue);
      if (Array.isArray(parsedValue)) {
        return parsedValue
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    } catch {}

    return trimmedValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const normalizePatient = (patient: any): DietPatient => ({
  ...patient,
  fullName: patient?.fullName || "Paciente sin nombre",
  dietRestrictions: normalizeStringArray(patient?.dietRestrictions),
  tags: normalizeStringArray(patient?.tags),
});

export const extractPatients = (payload: any): DietPatient[] => {
  if (Array.isArray(payload)) {
    return payload.map(normalizePatient);
  }

  if (Array.isArray(payload?.data)) {
    return payload.data.map(normalizePatient);
  }

  return [];
};

export const normalizeConstraintText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export const DEFAULT_CONSTRAINT_ALIASES = new Map(
  DEFAULT_CONSTRAINTS.flatMap((constraint) => {
    const normalizedId = normalizeConstraintText(constraint.id);
    const aliases = [normalizedId];

    if (normalizedId === "sin gluten") aliases.push("gluten");
    if (normalizedId === "celiaco") aliases.push("celiaco", "celiaca");
    if (normalizedId === "diabetico") aliases.push("diabetico", "diabetica");
    if (normalizedId === "hipertension") aliases.push("hipertension");
    if (normalizedId === "vegetariano") aliases.push("vegetariano", "vegetariana");

    return aliases.map((alias) => [alias, constraint.id] as const);
  }),
);

export const normalizeConstraintList = (constraints: string[]) =>
  Array.from(
    new Set(
      constraints
        .filter((constraint): constraint is string => typeof constraint === "string")
        .map((constraint) => constraint.trim())
        .filter(Boolean)
        .map((constraint) => {
          const normalized = normalizeConstraintText(constraint);
          return DEFAULT_CONSTRAINT_ALIASES.get(normalized) || constraint.trim();
        }),
    ),
  );

export const normalizeGroupName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const mapIngredientToMarketPrice = (
  ingredient: any,
  overrideGroup?: string,
): MarketPrice => ({
  id: ingredient.id,
  producto: ingredient.name,
  grupo: overrideGroup || ingredient.category?.name || "Varios",
  unidad: ingredient.unit || "g",
  precioPromedio: ingredient.price || 0,
  calorias: ingredient.calories || 0,
  proteinas: ingredient.proteins || 0,
  carbohidratos: ingredient.carbs || 0,
  lipidos: ingredient.lipids || 0,
  azucares: ingredient.sugars || 0,
  fibra: ingredient.fiber || 0,
  sodio: ingredient.sodium || 0,
  tags: ingredient.tags?.map((tag: any) => tag.name) || [],
  isDraft: !!ingredient.isDraft,
});

export const getUserDraftKey = () => {
  if (typeof window === "undefined") return "NutriNet_diet_draft";
  const user = getCurrentUser();
  if (user?.id) return `NutriNet_diet_draft_${user.id}`;
  return "NutriNet_diet_draft";
};

export const buildFoodInfoPreview = (food: any): MarketPrice => ({
  id: food?.id,
  producto: food?.producto || food?.name || "Desconocido",
  grupo: food?.grupo || food?.category?.name || "Varios",
  calorias: Number(food?.calorias ?? food?.calories ?? 0),
  proteinas: Number(food?.proteinas ?? food?.proteins ?? 0),
  carbohidratos: Number(food?.carbohidratos ?? food?.carbs ?? 0),
  lipidos: Number(food?.lipidos ?? food?.lipids ?? 0),
  azucares: Number(food?.azucares ?? food?.sugars ?? 0),
  fibra: Number(food?.fibra ?? food?.fiber ?? 0),
  sodio: Number(food?.sodio ?? food?.sodium ?? 0),
  unidad: food?.unidad || food?.unit || "g",
  precioPromedio: Number(food?.precioPromedio ?? food?.price ?? 0),
  tags:
    food?.tags?.map((tag: any) => (typeof tag === "string" ? tag : tag.name)) ||
    [],
  isDraft: !!food?.isDraft,
});

export const hasTagInList = (list: string[], tagName: string) =>
  list.some((tag) => tag.trim().toLowerCase() === tagName.trim().toLowerCase());

export const findNewlyAddedTag = (previousTags: string[], nextTags: string[]) =>
  nextTags.find((tag) => !hasTagInList(previousTags, tag));
