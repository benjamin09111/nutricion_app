export type ExchangeMacroBasis =
  | "carbs"
  | "protein"
  | "fat"
  | "dominant"
  | "none";

export type ExchangePortionProfile = {
  id: string;
  label: string;
  macroBasis: ExchangeMacroBasis;
  householdPortion: string;
  cho: number;
  protein: number;
  fat: number;
  kcal: number;
  ingredientCategories: string[];
  keywords: string[];
  clinicalNote: string;
  patientFriendlyPortion: string;
  isClinicalExchange: boolean;
  priority: number;
};

export type ExchangeFoodMacros = {
  carbs?: number | null;
  protein?: number | null;
  fat?: number | null;
};

export type ExchangeDetectionInput = {
  category?: string | null;
  name?: string | null;
  macros?: ExchangeFoodMacros | null;
};

export type ExchangeDetectionResult = {
  profile: ExchangePortionProfile;
  confidence: "high" | "medium" | "low";
  reason: string;
};

export type FoodExchangeResult = {
  profile: ExchangePortionProfile;
  confidence: "high" | "medium" | "low";
  reason: string;
  portions: number;
  displayPortions: string;
  grams: number;
  householdPortion: string;
  patientFriendlyPortion: string;
  basisLabel: string;
  note: string;
  isClinicalExchange: boolean;
};

export type PatientExchangeGuideRow = {
  category: string;
  portion: string;
  notes: string;
};

export type MacroTargetsLike = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type SuggestedExchangeRow = {
  category: string;
  amount: string;
  portions: number;
  cho: number;
  protein: number;
  fat: number;
  kcal: number;
  profileId: string;
};

const normalizeText = (value?: string | null) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const roundToSingle = (value: number) =>
  Math.round(Math.max(0, value) * 10) / 10;

const getMacroFrom100g = (macros: ExchangeFoodMacros) => ({
  carbs: Number(macros.carbs || 0),
  protein: Number(macros.protein || 0),
  fat: Number(macros.fat || 0),
});

const getDominantMacro = (macros: ExchangeFoodMacros): Exclude<ExchangeMacroBasis, "none" | "dominant"> => {
  const values = getMacroFrom100g(macros);
  if (values.protein >= values.carbs && values.protein >= values.fat) {
    return "protein";
  }
  if (values.fat >= values.carbs && values.fat >= values.protein) {
    return "fat";
  }
  return "carbs";
};

export const EXCHANGE_PORTION_PROFILES: ExchangePortionProfile[] = [
  {
    id: "cereales_tuberculos",
    label: "Cereales, panes y tuberculos",
    macroBasis: "carbs",
    householdPortion: "1/2 taza cocida, 1 rebanada de pan o 1 papa pequena",
    cho: 30,
    protein: 3,
    fat: 1,
    kcal: 140,
    ingredientCategories: ["Cereales y Derivados", "Papas", "Granos"],
    keywords: ["arroz", "avena", "pasta", "fideo", "pan", "tostada", "papa", "camote", "quinoa", "cereal", "tuberculo"],
    clinicalNote: "Base util para cuantificar almidones y reemplazos entre arroz, pan, pasta y papa.",
    patientFriendlyPortion: "1/2 taza cocida o 1 rebanada de pan",
    isClinicalExchange: true,
    priority: 100,
  },
  {
    id: "legumbres_secas",
    label: "Legumbres",
    macroBasis: "carbs",
    householdPortion: "3/4 taza cocida",
    cho: 30,
    protein: 12,
    fat: 1,
    kcal: 180,
    ingredientCategories: ["Legumbres y Cereales", "Otros"],
    keywords: ["lenteja", "garbanzo", "poroto", "frejol", "legumbre"],
    clinicalNote: "Aporta carbohidratos y proteina vegetal; suele reemplazar una porcion de almidon mas una fraccion proteica.",
    patientFriendlyPortion: "3/4 taza cocida",
    isClinicalExchange: true,
    priority: 110,
  },
  {
    id: "verduras_bajas",
    label: "Verduras de bajo aporte",
    macroBasis: "carbs",
    householdPortion: "2 tazas crudas o 1 taza cocida",
    cho: 5,
    protein: 2,
    fat: 0,
    kcal: 25,
    ingredientCategories: ["Verduras"],
    keywords: ["lechuga", "espinaca", "brocoli", "tomate", "pepino", "zapallo italiano", "verdura", "ensalada"],
    clinicalNote: "Se usa como base libre o de bajo aporte; priorizar volumen y fibra.",
    patientFriendlyPortion: "2 tazas crudas o 1 taza cocida",
    isClinicalExchange: true,
    priority: 120,
  },
  {
    id: "verduras_con_aporte",
    label: "Verduras con mayor aporte",
    macroBasis: "carbs",
    householdPortion: "1 taza cocida",
    cho: 10,
    protein: 2,
    fat: 0,
    kcal: 50,
    ingredientCategories: ["Verduras"],
    keywords: ["betarraga", "zanahoria", "choclo", "arveja", "verdura con aporte"],
    clinicalNote: "Conviene contarlas cuando se usan como acompanamiento principal o en volumen alto.",
    patientFriendlyPortion: "1 taza cocida",
    isClinicalExchange: true,
    priority: 90,
  },
  {
    id: "frutas",
    label: "Frutas",
    macroBasis: "carbs",
    householdPortion: "1 unidad mediana o 1 taza picada",
    cho: 15,
    protein: 0,
    fat: 0,
    kcal: 60,
    ingredientCategories: ["Frutas"],
    keywords: ["manzana", "pera", "platano", "banana", "naranja", "uva", "frutilla", "frambuesa", "fruta"],
    clinicalNote: "Priorizar fruta entera antes que jugos; buena para colaciones o postre.",
    patientFriendlyPortion: "1 unidad mediana o 1 taza picada",
    isClinicalExchange: true,
    priority: 100,
  },
  {
    id: "lacteos_descremados",
    label: "Lacteos descremados",
    macroBasis: "protein",
    householdPortion: "1 taza de leche o yogurt descremado",
    cho: 12,
    protein: 8,
    fat: 0,
    kcal: 80,
    ingredientCategories: ["Lacteos"],
    keywords: ["leche descremada", "yogurt descremado", "yogur descremado", "quesillo", "lacteo descremado"],
    clinicalNote: "Buen comodin para desayuno/once y para sumar proteina sin subir grasas.",
    patientFriendlyPortion: "1 taza de leche o yogurt descremado",
    isClinicalExchange: true,
    priority: 110,
  },
  {
    id: "lacteos_semidescremados",
    label: "Lacteos semidescremados",
    macroBasis: "protein",
    householdPortion: "1 taza de leche o yogurt semidescremado",
    cho: 12,
    protein: 8,
    fat: 5,
    kcal: 120,
    ingredientCategories: ["Lacteos"],
    keywords: ["semidescremado", "lacteo semidescremado"],
    clinicalNote: "Intermedio util cuando se busca mas saciedad manteniendo una carga controlada de grasa.",
    patientFriendlyPortion: "1 taza de leche o yogurt",
    isClinicalExchange: true,
    priority: 90,
  },
  {
    id: "lacteos_enteros",
    label: "Lacteos enteros",
    macroBasis: "protein",
    householdPortion: "1 taza de leche entera o 1 porcion de queso fresco",
    cho: 12,
    protein: 8,
    fat: 8,
    kcal: 150,
    ingredientCategories: ["Lacteos", "Postres de Leche"],
    keywords: ["leche entera", "queso", "yogurt entero", "postre de leche"],
    clinicalNote: "Contar por separado cuando el lacteo aporta grasa relevante.",
    patientFriendlyPortion: "1 taza de leche o 1 porcion de queso fresco",
    isClinicalExchange: true,
    priority: 80,
  },
  {
    id: "proteina_magra",
    label: "Proteina magra",
    macroBasis: "protein",
    householdPortion: "50 g cocidos o 1/2 pechuga pequena",
    cho: 0,
    protein: 11,
    fat: 2,
    kcal: 65,
    ingredientCategories: ["Carnes y Visceras", "Proteinas"],
    keywords: ["pollo", "pavo", "posta", "lomo liso", "atun al agua", "carne magra", "proteina magra"],
    clinicalNote: "Base para carnes magras; se usa mucho en almuerzo, cena y colaciones proteicas.",
    patientFriendlyPortion: "50 g cocidos",
    isClinicalExchange: true,
    priority: 110,
  },
  {
    id: "proteina_semigrasa",
    label: "Proteina semigrasa",
    macroBasis: "protein",
    householdPortion: "50 g cocidos",
    cho: 0,
    protein: 11,
    fat: 5,
    kcal: 95,
    ingredientCategories: ["Carnes y Visceras", "Proteinas"],
    keywords: ["vacuno", "cerdo", "queso semigraso", "proteina semigrasa"],
    clinicalNote: "Util para cortes medios y preparaciones con algo mas de grasa.",
    patientFriendlyPortion: "50 g cocidos",
    isClinicalExchange: true,
    priority: 90,
  },
  {
    id: "proteina_grasa",
    label: "Proteina grasa",
    macroBasis: "protein",
    householdPortion: "50 g cocidos",
    cho: 0,
    protein: 11,
    fat: 8,
    kcal: 120,
    ingredientCategories: ["Carnes y Visceras", "Productos Salados"],
    keywords: ["chorizo", "salchicha", "tocino", "longaniza", "embutido", "proteina grasa"],
    clinicalNote: "Conviene reservarla para frecuencia baja o cuando se planifica como extra.",
    patientFriendlyPortion: "50 g cocidos",
    isClinicalExchange: true,
    priority: 80,
  },
  {
    id: "huevos",
    label: "Huevos",
    macroBasis: "protein",
    householdPortion: "1 huevo entero grande",
    cho: 0,
    protein: 6,
    fat: 5,
    kcal: 70,
    ingredientCategories: ["Huevos"],
    keywords: ["huevo", "claras", "omelette"],
    clinicalNote: "Usar por unidad; muy practico para desayuno, once o colacion proteica.",
    patientFriendlyPortion: "1 huevo entero",
    isClinicalExchange: true,
    priority: 120,
  },
  {
    id: "pescados_mariscos",
    label: "Pescados y mariscos",
    macroBasis: "protein",
    householdPortion: "80 g cocidos",
    cho: 0,
    protein: 11,
    fat: 2,
    kcal: 70,
    ingredientCategories: ["Pescados y Mariscos"],
    keywords: ["pescado", "salmon", "reineta", "merluza", "jurel", "atun", "camaron", "marisco"],
    clinicalNote: "Equivalente proteico util para intercambiar con carnes magras, ajustando grasa segun especie.",
    patientFriendlyPortion: "80 g cocidos",
    isClinicalExchange: true,
    priority: 120,
  },
  {
    id: "grasas_saludables",
    label: "Grasas y aceites",
    macroBasis: "fat",
    householdPortion: "1 cucharada de aceite, 1/4 de palta o 25 g de frutos secos",
    cho: 0,
    protein: 0,
    fat: 20,
    kcal: 180,
    ingredientCategories: ["Grasas y Aceites", "Semillas y Nueces"],
    keywords: ["aceite", "palta", "nuez", "almendra", "mani", "mantequilla de mani", "semilla", "fruto seco", "grasa"],
    clinicalNote: "Importante para densidad energetica y saciedad; contarla por separado.",
    patientFriendlyPortion: "1 cucharada de aceite o 1/4 de palta",
    isClinicalExchange: true,
    priority: 110,
  },
  {
    id: "azucares_extras",
    label: "Azucares y extras",
    macroBasis: "carbs",
    householdPortion: "1 cucharadita a 1 cucharada, segun alimento",
    cho: 5,
    protein: 0,
    fat: 0,
    kcal: 20,
    ingredientCategories: ["Azucares y Miel", "Alimentos Dulces"],
    keywords: ["azucar", "miel", "mermelada", "manjar", "galleta", "dulce", "chocolate"],
    clinicalNote: "Sirve para cuantificar extras y modular su presencia dentro del plan.",
    patientFriendlyPortion: "1 cucharadita a 1 cucharada",
    isClinicalExchange: true,
    priority: 90,
  },
  {
    id: "bebidas_jugos",
    label: "Bebidas y jugos con azucar",
    macroBasis: "carbs",
    householdPortion: "1 vaso de 200 ml",
    cho: 15,
    protein: 0,
    fat: 0,
    kcal: 60,
    ingredientCategories: ["Jugos y Nectares", "Bebidas", "Bebidas Alcoholicas"],
    keywords: ["jugo", "nectar", "bebida", "gaseosa", "cerveza", "vino"],
    clinicalNote: "Contarlas como carbohidrato rapido; idealmente limitar en el plan base.",
    patientFriendlyPortion: "1 vaso de 200 ml",
    isClinicalExchange: true,
    priority: 70,
  },
  {
    id: "platos_preparados",
    label: "Platos preparados",
    macroBasis: "dominant",
    householdPortion: "Revisar la receta o los gramos reales del plato",
    cho: 0,
    protein: 0,
    fat: 0,
    kcal: 0,
    ingredientCategories: ["Platos Preparados"],
    keywords: ["lasana", "lasagna", "pizza", "hamburguesa", "empanada", "plato preparado"],
    clinicalNote: "Se estima por macro predominante si hay informacion nutricional; si no, requiere revision manual.",
    patientFriendlyPortion: "Revisar la receta o el gramaje",
    isClinicalExchange: false,
    priority: 60,
  },
  {
    id: "sin_intercambio_clinico",
    label: "Sin intercambio clinico",
    macroBasis: "none",
    householdPortion: "No aplica",
    cho: 0,
    protein: 0,
    fat: 0,
    kcal: 0,
    ingredientCategories: ["Especias", "Endulzantes", "Salsas", "Refrescos en Polvo", "Otros"],
    keywords: ["endulzante", "stevia", "sucralosa", "te", "cafe", "agua", "especia", "condimento", "sal", "vinagre", "light", "zero"],
    clinicalNote: "No forzar equivalencias falsas; dejar como complemento, condimento o producto sin carga relevante.",
    patientFriendlyPortion: "Uso libre o segun tolerancia",
    isClinicalExchange: false,
    priority: 130,
  },
];

const getProfileById = (id: string) =>
  EXCHANGE_PORTION_PROFILES.find((profile) => profile.id === id) ||
  EXCHANGE_PORTION_PROFILES[0];

const dominantFallbackProfileId: Record<Exclude<ExchangeMacroBasis, "none" | "dominant">, string> = {
  carbs: "cereales_tuberculos",
  protein: "proteina_magra",
  fat: "grasas_saludables",
};

export const getExchangeCoverageRows = () =>
  EXCHANGE_PORTION_PROFILES.map((profile) => ({
    profileId: profile.id,
    label: profile.label,
    categoriesCovered: profile.ingredientCategories.join(", "),
    householdPortion: profile.householdPortion,
    clinicalNote: profile.clinicalNote,
    isClinicalExchange: profile.isClinicalExchange,
  }));

export function getExchangeProfileForFood(
  input: ExchangeDetectionInput,
): ExchangeDetectionResult {
  const categoryText = normalizeText(input.category);
  const nameText = normalizeText(input.name);
  const combined = `${categoryText} ${nameText}`.trim();
  const macros = input.macros || {};

  const exactMatches = EXCHANGE_PORTION_PROFILES
    .map((profile) => {
      const categoryMatch = profile.ingredientCategories.some((category) =>
        combined.includes(normalizeText(category)),
      );
      const keywordMatch = profile.keywords.some((keyword) =>
        combined.includes(normalizeText(keyword)),
      );
      const score =
        (categoryMatch ? 3 : 0) +
        (keywordMatch ? 2 : 0) +
        profile.priority / 1000;
      return { profile, categoryMatch, keywordMatch, score };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score);

  if (exactMatches.length > 0) {
    const top = exactMatches[0];
    return {
      profile: top.profile,
      confidence: top.categoryMatch && top.keywordMatch ? "high" : "medium",
      reason: top.keywordMatch
        ? "matched_by_keyword"
        : "matched_by_category",
    };
  }

  if (
    categoryText.includes("plato preparado") ||
    nameText.includes("plato preparado")
  ) {
    return {
      profile: getProfileById("platos_preparados"),
      confidence: "medium",
      reason: "prepared_dish_category",
    };
  }

  const numeric = getMacroFrom100g(macros);
  if (numeric.carbs > 0 || numeric.protein > 0 || numeric.fat > 0) {
    const dominant = getDominantMacro(macros);
    return {
      profile: getProfileById(dominantFallbackProfileId[dominant]),
      confidence: "low",
      reason: `fallback_${dominant}`,
    };
  }

  return {
    profile: getProfileById("sin_intercambio_clinico"),
    confidence: "low",
    reason: "no_match",
  };
}

export function calculateFoodExchange(input: {
  grams: number;
  macrosPer100g: ExchangeFoodMacros;
  profile?: ExchangePortionProfile;
  category?: string | null;
  name?: string | null;
}): FoodExchangeResult {
  const detection = input.profile
    ? {
        profile: input.profile,
        confidence: "high" as const,
        reason: "provided_profile",
      }
    : getExchangeProfileForFood({
        category: input.category,
        name: input.name,
        macros: input.macrosPer100g,
      });

  const grams = Math.max(0, Number(input.grams) || 0);
  const macros = getMacroFrom100g(input.macrosPer100g);
  const totalCarbs = (macros.carbs * grams) / 100;
  const totalProtein = (macros.protein * grams) / 100;
  const totalFat = (macros.fat * grams) / 100;

  let basis: ExchangeMacroBasis = detection.profile.macroBasis;
  if (basis === "dominant") {
    basis = getDominantMacro(input.macrosPer100g);
  }

  let divisor = 0;
  let basisLabel = "Sin intercambio";
  if (basis === "carbs") {
    divisor = detection.profile.cho || 0;
    basisLabel = `${detection.profile.cho} g CHO`;
  } else if (basis === "protein") {
    divisor = detection.profile.protein || 0;
    basisLabel = `${detection.profile.protein} g prot`;
  } else if (basis === "fat") {
    divisor = detection.profile.fat || 0;
    basisLabel = `${detection.profile.fat} g grasas`;
  }

  let numerator = 0;
  if (basis === "carbs") numerator = totalCarbs;
  if (basis === "protein") numerator = totalProtein;
  if (basis === "fat") numerator = totalFat;

  const portions =
    detection.profile.macroBasis === "none" || divisor <= 0
      ? 0
      : roundToSingle(numerator / divisor);

  const note =
    detection.profile.id === "platos_preparados"
      ? "Estimacion por macro predominante. Conviene revisar receta completa."
      : detection.profile.clinicalNote;

  return {
    profile: detection.profile,
    confidence: detection.confidence,
    reason: detection.reason,
    portions,
    displayPortions: portions.toFixed(1),
    grams,
    householdPortion: detection.profile.householdPortion,
    patientFriendlyPortion: detection.profile.patientFriendlyPortion,
    basisLabel,
    note,
    isClinicalExchange: detection.profile.isClinicalExchange,
  };
}

export function calculateGramsForExchange(input: {
  targetPortions: number;
  macrosPer100g: ExchangeFoodMacros;
  profile?: ExchangePortionProfile;
  category?: string | null;
  name?: string | null;
}): number {
  const detection = input.profile
    ? {
        profile: input.profile,
        confidence: "high" as const,
        reason: "provided_profile",
      }
    : getExchangeProfileForFood({
        category: input.category,
        name: input.name,
        macros: input.macrosPer100g,
      });

  const portions = Math.max(0, Number(input.targetPortions) || 0);
  const macros = getMacroFrom100g(input.macrosPer100g);

  let basis: ExchangeMacroBasis = detection.profile.macroBasis;
  if (basis === "dominant") {
    basis = getDominantMacro(input.macrosPer100g);
  }

  if (basis === "carbs" && macros.carbs > 0) {
    return Math.round((portions * detection.profile.cho * 100) / macros.carbs);
  }
  if (basis === "protein" && macros.protein > 0) {
    return Math.round((portions * detection.profile.protein * 100) / macros.protein);
  }
  if (basis === "fat" && macros.fat > 0) {
    return Math.round((portions * detection.profile.fat * 100) / macros.fat);
  }
  return 0;
}

export function buildExchangeGuideForAi() {
  return EXCHANGE_PORTION_PROFILES.filter((profile) => profile.isClinicalExchange).map(
    (profile) =>
      `${profile.label}: 1 intercambio = ${profile.householdPortion}. Aporta ${profile.cho} g CHO, ${profile.protein} g proteina, ${profile.fat} g grasa y ${profile.kcal} kcal. Nota: ${profile.clinicalNote}`,
  );
}

export function buildExchangeGuideForPatient(): PatientExchangeGuideRow[] {
  return EXCHANGE_PORTION_PROFILES.filter((profile) => profile.isClinicalExchange).map(
    (profile) => ({
      category: profile.label,
      portion: profile.patientFriendlyPortion,
      notes: profile.clinicalNote,
    }),
  );
}

export function buildSuggestedExchangeRows(
  macros: MacroTargetsLike,
): SuggestedExchangeRow[] {
  const rows: Array<{ profileId: string; portions: number }> = [
    {
      profileId: "cereales_tuberculos",
      portions: roundToSingle((Math.max(macros.carbs - 45, 0) * 0.55) / 30),
    },
    {
      profileId: "legumbres_secas",
      portions: macros.calories >= 1600 ? 1 : 0,
    },
    {
      profileId: "frutas",
      portions: Math.max(2, Math.round(Math.max(macros.carbs, 120) / 45)),
    },
    {
      profileId: "verduras_bajas",
      portions: 4,
    },
    {
      profileId: "proteina_magra",
      portions: roundToSingle((macros.protein * 0.7) / 11),
    },
    {
      profileId: "lacteos_descremados",
      portions: Math.max(1, Math.round((macros.protein * 0.15) / 8)),
    },
    {
      profileId: "grasas_saludables",
      portions: roundToSingle(macros.fats / 20),
    },
    {
      profileId: "azucares_extras",
      portions: macros.calories >= 2200 ? 1 : 0,
    },
  ];

  return rows
    .filter((row) => row.portions > 0)
    .map((row) => {
      const profile = getProfileById(row.profileId);
      return {
        category: profile.label,
        amount: profile.householdPortion,
        portions: row.portions,
        cho: Math.round(profile.cho * row.portions),
        protein: Math.round(profile.protein * row.portions),
        fat: Math.round(profile.fat * row.portions),
        kcal: Math.round(profile.kcal * row.portions),
        profileId: profile.id,
      };
    });
}
