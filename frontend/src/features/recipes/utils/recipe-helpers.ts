import mealSectionsData from "@/content/meal-sections.json";
import {
  calculateGET,
  calculateAge,
  type ActivityLevel as NutritionActivityLevel,
} from "@/lib/nutrition-formulas";

// -- Shared Types --

export type RecipeCatalogTab = "mine" | "community" | "app";

export type RecipeMetadata = {
  tags?: string[];
  mealSection?: string;
  customIngredientNames?: string[];
  customIngredients?: Array<string | { name?: string }>;
  ingredients?: string[];
  source?: string;
};

export type RecipeIngredientDetail = {
  name: string;
  quantity?: string;
  amount?: number;
  unit?: string;
  isMain?: boolean;
};

export type RecipeApiSummary = {
  id: string;
  name: string;
  description?: string;
  preparation?: string;
  portions: number;
  proteins: number;
  carbs: number;
  lipids: number;
  calories: number;
  isPublic: boolean;
  isMine?: boolean;
  isAdopted?: boolean;
  nutritionist?: { fullName?: string | null } | null;
  metadata?: RecipeMetadata | null;
  ingredients?: { isMain: boolean; amount?: number; unit?: string; ingredient: { name: string } }[];
  matchPercentage?: number;
  matchCount?: number;
  totalMain?: number;
  totalMainCount?: number;
};

export interface Recipe {
  id: string;
  title: string;
  description: string;
  preparation?: string;
  recommendedPortion?: string;
  portions?: number;
  complexity: "simple" | "elaborada";
  protein: number;
  calories: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  ingredientDetails?: RecipeIngredientDetail[];
  extraIngredients?: string[];
  image?: string;
  source: RecipeCatalogTab;
  authorLabel?: string;
  mainIngredients: string[];
  mealSection?: string;
  matchPercentage?: number;
  matchCount?: number;
  totalMain?: number;
}

export interface MealSlot {
  id: string;
  time: string;
  type: "desayuno" | "almuerzo" | "merienda" | "cena" | "extra";
  label: string;
  mealSection?: string;
  isUserAdded?: boolean;
  recipe?: Recipe;
}

export interface QuickIngredient {
  name: string;
  quantity?: string;
  amount?: string;
  unit?: string;
}

export interface QuickGeneratedDish {
  id: string; // client-only UUID
  title: string;
  mealSection: string;
  description: string;
  preparation: string;
  recommendedPortion: string;
  portions?: number;
  protein: number;
  calories: number;
  carbs: number;
  fats: number;
  ingredients: QuickIngredient[];
  ingredientDetails?: RecipeIngredientDetail[];
}

export type MealSectionTarget = {
  mealSection: string;
  count: number;
};

export type SubstituteMealSection = "desayuno" | "almuerzo";

export type SubstituteRecipeItem = {
  id: string;
  title: string;
  mealSection?: string;
};

export type NutritionGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type ActivityLevel = "sedentario" | "deportista";

export type PatientContext = {
  id?: string;
  importedPatientId?: string | null;
  source: "manual" | "imported";
  fullName: string;
  ageYears?: number | null;
  gender?: string;
  restrictions: string[];
  noDietaryRestrictions?: boolean;
  likes?: string;
  nutritionalFocus?: string;
  fitnessGoals?: string;
  birthDate?: string;
  weight?: number;
  height?: number;
  activityLevel?: ActivityLevel;
  nutritionGoals?: NutritionGoals | null;
  patientData?: any;
  updatedAt: string;
};

export type ProteinSupplement = {
  enabled: boolean;
  gramsPerDay: number;
};

export type PlannerView = "daily" | "weekly";

export type RecipesGuideSectionId =
  | "base"
  | "patient"
  | "structure"
  | "library"
  | "planner";

// -- Shared Helper Functions --

export const calculateAgeYears = (birthDate?: string) => {
  if (!birthDate) return undefined;
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : undefined;
};

export const sanitizeNutritionGoals = (value: any): NutritionGoals | null => {
  if (!value || typeof value !== "object") return null;

  const calories = Number(value.calories);
  const protein = Number(value.protein);
  const carbs = Number(value.carbs);
  const fats = Number(value.fats);

  if ([calories, protein].some((item) => !Number.isFinite(item) || item <= 0)) {
    return null;
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fats: Math.round(fats),
  };
};

export const normalizeString = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const getCustomVariablesArray = (patient: any): any[] =>
  Array.isArray(patient?.customVariables) ? patient.customVariables : [];

export const findCustomVariable = (customVariables: any[], key: string) => {
  const wantedKey = normalizeString(key);
  return customVariables.find((item) => normalizeString(item?.key || "") === wantedKey);
};

export const readCustomVariableNumber = (customVariables: any[], key: string): number | null => {
  const item = findCustomVariable(customVariables, key);
  const parsed = Number(item?.value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const readCustomVariableText = (customVariables: any[], key: string): string | null => {
  const item = findCustomVariable(customVariables, key);
  const value = String(item?.value || "").trim();
  return value ? value : null;
};

export const getActivityLevel = (patient: any): ActivityLevel | undefined => {
  const customVariables = getCustomVariablesArray(patient);
  const raw = normalizeString(readCustomVariableText(customVariables, "activityLevel") || "");
  if (raw === "sedentario") return "sedentario";
  if (raw === "deportista") return "deportista";
  return undefined;
};

export const getGoalsFromPatient = (patient: any): NutritionGoals | null => {
  const customVariables = getCustomVariablesArray(patient);
  const goals = {
    calories: readCustomVariableNumber(customVariables, "targetCalories"),
    protein: readCustomVariableNumber(customVariables, "targetProtein"),
    carbs: readCustomVariableNumber(customVariables, "targetCarbs"),
    fats: readCustomVariableNumber(customVariables, "targetFats"),
  };

  if (goals.calories && goals.protein) {
    return {
      calories: Math.round(goals.calories),
      protein: Math.round(goals.protein),
      carbs: goals.carbs ? Math.round(goals.carbs) : Math.round((goals.calories * 0.55) / 4),
      fats: goals.fats ? Math.round(goals.fats) : Math.round((goals.calories * 0.25) / 9),
    };
  }

  const fromGoals = sanitizeNutritionGoals(patient?.nutritionGoals);
  if (fromGoals) return fromGoals;

  const weight = Number(patient?.weight) || 0;
  const height = Number(patient?.height) || 0;
  const gender = (patient?.gender === "Masculino" || patient?.gender === "Femenino")
    ? patient.gender
    : "Femenino";
  const age = calculateAge(patient?.birthDate) || 30;
  const activityLevel = (getActivityLevel(patient) || "sedentario") as NutritionActivityLevel;

  if (weight > 0 && height > 0) {
    const get = calculateGET(gender, weight, height, age, activityLevel);
    if (get) {
      return {
        calories: get.macros.calories,
        protein: get.macros.protein,
        carbs: get.macros.carbs,
        fats: get.macros.fats,
      };
    }
  }

  return null;
};

export const getRecommendedProteinRange = (
  weightKg: number | undefined,
  activityLevel: ActivityLevel | undefined,
) => {
  if (!weightKg || weightKg <= 0 || !activityLevel) return null;

  const minMultiplier = activityLevel === "deportista" ? 1.5 : 0.8;
  const maxMultiplier = activityLevel === "deportista" ? 2.5 : 1.0;

  return {
    min: Math.round(weightKg * minMultiplier),
    max: Math.round(weightKg * maxMultiplier),
  };
};

export const parseDelimitedList = (value: string) =>
  Array.from(
    new Set(
      value
        .split(/[,;\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

export const createEmptyPatientContext = (): PatientContext => ({
  source: "manual",
  fullName: "",
  ageYears: null,
  gender: "",
  restrictions: [],
  noDietaryRestrictions: false,
  likes: "",
  nutritionalFocus: "",
  fitnessGoals: "",
  updatedAt: new Date().toISOString(),
});

export const normalizePatientContext = (patient: any): PatientContext | null => {
  if (!patient || typeof patient !== "object") return null;

  const restrictions = Array.isArray(patient.restrictions)
    ? patient.restrictions
    : Array.isArray(patient.dietRestrictions)
      ? patient.dietRestrictions
      : [];

  const cleanedRestrictions: string[] = Array.from(
    new Set(
      restrictions
        .map((item: unknown) => String(item || "").trim())
        .filter(Boolean),
    ),
  );

  const fullName = String(patient.fullName || patient.name || "").trim();

  const parsedAge =
    Number.isFinite(Number(patient.ageYears)) && Number(patient.ageYears) >= 0
      ? Math.round(Number(patient.ageYears))
      : calculateAgeYears(patient.birthDate);

  const weight =
    Number.isFinite(Number(patient.weight)) && Number(patient.weight) > 0
      ? Number(patient.weight)
      : undefined;
  const height =
    Number.isFinite(Number(patient.height)) && Number(patient.height) > 0
      ? Number(patient.height)
      : undefined;

  return {
    id: typeof patient.id === "string" && patient.id ? patient.id : undefined,
    importedPatientId:
      typeof patient.importedPatientId === "string"
        ? patient.importedPatientId
        : typeof patient.id === "string" && patient.id
          ? patient.id
          : null,
    source: patient.source === "manual" || !patient.id ? "manual" : "imported",
    fullName,
    ageYears: parsedAge ?? null,
    gender: String(patient.gender || "").trim(),
    restrictions: cleanedRestrictions,
    noDietaryRestrictions:
      typeof patient.noDietaryRestrictions === "boolean"
        ? patient.noDietaryRestrictions
        : cleanedRestrictions.length === 0,
    likes: String(patient.likes || "").trim(),
    nutritionalFocus: String(patient.nutritionalFocus || "").trim(),
    fitnessGoals: String(patient.fitnessGoals || "").trim(),
    birthDate: String(patient.birthDate || "").trim() || undefined,
    weight,
    height,
    activityLevel:
      patient.activityLevel === "sedentario" || patient.activityLevel === "deportista"
        ? patient.activityLevel
        : getActivityLevel(patient),
    nutritionGoals: sanitizeNutritionGoals(patient.nutritionGoals) || getGoalsFromPatient(patient),
    patientData: patient.patientData || patient,
    updatedAt: new Date().toISOString(),
  };
};

export const buildRecipeIngredientHints = (
  slotsByDay: Record<string, MealSlot[]>,
): Array<{ name: string; weeklyHits: number }> => {
  const counter = new Map<string, number>();
  Object.values(slotsByDay).forEach((slots) => {
    slots.forEach((slot) => {
      const recipe = slot.recipe;
      const ingredientNames =
        recipe && Array.isArray(recipe.ingredientDetails) && recipe.ingredientDetails.length > 0
          ? recipe.ingredientDetails.map((ingredient) => ingredient.name)
          : recipe?.ingredients || [];
      ingredientNames.forEach((ingredientName) => {
        const key = String(ingredientName).toLowerCase().trim();
        counter.set(key, (counter.get(key) || 0) + 1);
      });
    });
  });
  return Array.from(counter.entries()).map(([name, weeklyHits]) => ({
    name,
    weeklyHits,
  }));
};

export const buildExtraIngredientsFromAi = (
  slotsByDay: Record<string, MealSlot[]>,
): Array<{ name: string; weeklyHits: number }> => {
  const counter = new Map<string, number>();
  Object.values(slotsByDay).forEach((slots) => {
    slots.forEach((slot) => {
      (slot.recipe?.extraIngredients || []).forEach((ingredientName) => {
        const key = ingredientName.trim();
        if (!key) return;
        counter.set(key, (counter.get(key) || 0) + 1);
      });
    });
  });
  return Array.from(counter.entries()).map(([name, weeklyHits]) => ({
    name,
    weeklyHits,
  }));
};

export const normalizeMealSlot = (slot: MealSlot): MealSlot => ({
  ...slot,
  isUserAdded:
    typeof slot.isUserAdded === "boolean"
      ? slot.isUserAdded
      : MANUAL_SLOT_ID_PATTERN.test(slot.id),
});

export const normalizeWeekSlots = (
  slotsByDay: Record<string, MealSlot[]>,
  dayLabels: string[],
) => {
  const normalized: Record<string, MealSlot[]> = {};

  dayLabels.forEach((day) => {
    normalized[day] = (slotsByDay[day] || []).map(normalizeMealSlot);
  });

  return normalized;
};

export const getStructureTemplate = (slots: MealSlot[]) =>
  slots.map(({ id, time, type, label, mealSection, isUserAdded }) => ({
    id,
    time,
    type,
    label,
    mealSection,
    isUserAdded,
  }));

export const classifyRecipeSource = (recipe: RecipeApiSummary): RecipeCatalogTab => {
  if (recipe.isMine || recipe.isAdopted) {
    return "mine";
  }

  return recipe.nutritionist?.fullName ? "community" : "app";
};

export const mapRecipeSummaryToRecipe = (recipe: RecipeApiSummary): Recipe => {
  const ingredientNames = (recipe.ingredients || []).map((item) => item.ingredient.name);
  const metadataIngredientNames = Array.from(
    new Set([
      ...(recipe.metadata?.customIngredientNames || []),
      ...(recipe.metadata?.customIngredients || []).map((item) =>
        typeof item === "string" ? item : item?.name || "",
      ),
      ...(recipe.metadata?.ingredients || []),
    ]),
  ).filter(Boolean);
  const resolvedIngredientNames =
    ingredientNames.length > 0 ? ingredientNames : metadataIngredientNames;
  const resolvedMainIngredients = (recipe.ingredients || [])
    .filter((item) => item.isMain)
    .map((item) => item.ingredient.name);
  const mainIngredients =
    resolvedMainIngredients.length > 0
      ? resolvedMainIngredients
      : resolvedIngredientNames.slice(0, Math.max(1, Math.min(3, resolvedIngredientNames.length)));

  return {
    id: recipe.id,
    title: recipe.name,
    description:
      recipe.description ||
      recipe.preparation ||
      "Plato disponible para asignar a este bloque.",
    preparation: recipe.preparation || undefined,
    portions: recipe.portions,
    complexity:
      resolvedIngredientNames.length > 6 || (recipe.preparation || "").length > 180
        ? "elaborada"
        : "simple",
    protein: recipe.proteins || 0,
    calories: recipe.calories || 0,
    carbs: recipe.carbs || 0,
    fats: recipe.lipids || 0,
    ingredients: ingredientNames,
    ingredientDetails: (recipe.ingredients || []).map((item) => ({
      name: item.ingredient.name,
      amount: Number.isFinite(Number(item.amount)) ? Number(item.amount) : undefined,
      unit: item.unit,
      isMain: item.isMain,
    })),
    source: classifyRecipeSource(recipe),
    authorLabel: recipe.nutritionist?.fullName || undefined,
    mainIngredients,
    mealSection: recipe.metadata?.mealSection || undefined,
    matchPercentage: recipe.matchPercentage,
    matchCount: recipe.matchCount,
    totalMain: recipe.totalMain,
  };
};

export const createCycleDayLabels = (count: number) => {
  const safeCount = Math.max(1, Math.min(7, count));
  if (safeCount === 7) return [...WEEKDAY_LABELS];
  return Array.from({ length: safeCount }, (_, i) => `Día ${i + 1}`);
};

export const cn = (...inputs: any[]) => {
  return inputs.filter(Boolean).join(" ");
};

// -- Constants --

export const MOCK_RECIPES: Recipe[] = [
  {
    id: "r1",
    title: "Bowl de Pollo y Arroz Primavera",
    description: "Pollo a la plancha con arroz integral y vegetales salteados.",
    complexity: "simple",
    protein: 35,
    calories: 450,
    carbs: 45,
    fats: 12,
    ingredients: ["Pechuga de Pollo", "Arroz", "Zanahoria", "Arvejas"],
    source: "app",
    mainIngredients: ["Pechuga de Pollo", "Arroz"],
    mealSection: "almuerzo",
  },
  {
    id: "r2",
    title: "Risotto de Champiñones Proteico",
    description: "Arroz cremoso con champiñones y trozos de pollo marinado.",
    complexity: "elaborada",
    protein: 38,
    calories: 520,
    carbs: 55,
    fats: 15,
    source: "app",
    mainIngredients: ["Arroz", "Pollo"],
    mealSection: "cena",
    ingredients: ["Arroz", "Pollo", "Champiñones", "Cebolla", "Vino Blanco"],
  },
  {
    id: "r3",
    title: "Tostadas con Huevo y Palta",
    description: "Pan integral tostado con huevo y palta machacada.",
    complexity: "simple",
    protein: 15,
    calories: 320,
    carbs: 25,
    fats: 18,
    ingredients: ["Pan", "Huevo", "Palta"],
    source: "app",
    mainIngredients: ["Pan", "Huevo"],
    mealSection: "desayuno",
  },
];

export const SLOT_LIBRARY: Record<number, Omit<MealSlot, "recipe">[]> = {
  3: [
    { id: "slot-breakfast", time: "08:00", type: "desayuno", label: "Desayuno", mealSection: "desayuno" },
    { id: "slot-lunch", time: "13:00", type: "almuerzo", label: "Almuerzo", mealSection: "almuerzo" },
    { id: "slot-dinner", time: "21:00", type: "cena", label: "Cena", mealSection: "cena" },
  ],
  4: [
    { id: "slot-breakfast", time: "08:00", type: "desayuno", label: "Desayuno", mealSection: "desayuno" },
    { id: "slot-lunch", time: "13:00", type: "almuerzo", label: "Almuerzo", mealSection: "almuerzo" },
    { id: "slot-snack-1", time: "17:00", type: "merienda", label: "Merienda", mealSection: "merienda" },
    { id: "slot-dinner", time: "21:00", type: "cena", label: "Cena", mealSection: "cena" },
  ],
  5: [
    { id: "slot-breakfast", time: "08:00", type: "desayuno", label: "Desayuno", mealSection: "desayuno" },
    { id: "slot-snack-1", time: "11:00", type: "merienda", label: "Merienda AM", mealSection: "merienda" },
    { id: "slot-lunch", time: "13:30", type: "almuerzo", label: "Almuerzo", mealSection: "almuerzo" },
    { id: "slot-snack-2", time: "17:30", type: "merienda", label: "Merienda PM", mealSection: "merienda" },
    { id: "slot-dinner", time: "21:00", type: "cena", label: "Cena", mealSection: "cena" },
  ],
  6: [
    { id: "slot-breakfast", time: "08:00", type: "desayuno", label: "Desayuno", mealSection: "desayuno" },
    { id: "slot-snack-1", time: "10:30", type: "merienda", label: "Merienda 1", mealSection: "merienda" },
    { id: "slot-lunch", time: "13:30", type: "almuerzo", label: "Almuerzo", mealSection: "almuerzo" },
    { id: "slot-snack-2", time: "16:30", type: "merienda", label: "Merienda 2", mealSection: "merienda" },
    { id: "slot-snack-3", time: "19:00", type: "merienda", label: "Merienda 3", mealSection: "merienda" },
    { id: "slot-dinner", time: "21:30", type: "cena", label: "Cena", mealSection: "cena" },
  ],
};

export const DEFAULT_MEAL_COUNT = 3;

export const DEFAULT_SLOTS: MealSlot[] = SLOT_LIBRARY[DEFAULT_MEAL_COUNT].map((slot) => ({
  ...slot,
  recipe: undefined,
}));

export const RECIPE_MEAL_SECTIONS = [
  { value: "", label: "Todos" },
  ...mealSectionsData,
];

export const UNIQUE_MEAL_SECTIONS = new Set(["desayuno", "almuerzo", "once", "cena"]);
export const MANUAL_SLOT_ID_PATTERN = /^slot-[a-z-]+-\d+$/;

export const DEFAULT_RECIPE_IMAGES: Record<string, string> = {
  desayuno:
    "https://www.paulinacocina.net/wp-content/uploads/2025/07/desayuno-americano-con-hot-cakes-1753957224.jpg",
  almuerzo:
    "https://aratiendas.com/wp-content/uploads/2024/02/shutterstock_1178196637-1024x683.webp",
  cena:
    "https://www.recetasnestle.cl/sites/default/files/2022-09/enrollado-de-vegetales-idea-de-cena-rapida.jpg",
  once:
    "https://cloudfront-us-east-1.images.arcpublishing.com/copesa/PQ5OFRF55NDKHIHKZ3M7KVEWTQ.jpg",
  merienda:
    "https://saposyprincesas.elmundo.es/assets/2019/05/merienda-saludable-destacada.jpg",
  otro: "https://www.ecured.cu/images/3/39/Alimento.jpg",
};

export const WEEKDAY_LABELS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
