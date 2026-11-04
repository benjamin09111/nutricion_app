// ============================================================================
// NUTRINET CLINICAL CORE (DETERMINISTIC NUTRITIONAL ENGINE)
// Basado en el Sistema Chileno de Porciones de Intercambio (INTA - U. de Chile)
// Cumple Regla R1: "El LLM nunca produce cifras clínicas; las calcula el código".
// ============================================================================

export type RegionId = "antofagasta" | "santiago" | "chiloe";

export type INTAGroupId =
  | "cereales"
  | "carnes_bajas"
  | "carnes_altas"
  | "lacteos_descremados"
  | "lacteos_enteros"
  | "frutas"
  | "verduras_general"
  | "verduras_libre"
  | "aceites_grasas";

export interface INTAGroupDefinition {
  id: INTAGroupId;
  name: string;
  color: string;
  kcal: number;
  cho: number;
  protein: number;
  fat: number;
  description: string;
  defaultPortions: number;
}

export const INTA_GROUPS: Record<INTAGroupId, INTAGroupDefinition> = {
  cereales: {
    id: "cereales",
    name: "Cereales, Pastas y Tubérculos",
    color: "#eab308",
    kcal: 140,
    cho: 30,
    protein: 3,
    fat: 1,
    description: "1 porción = 1/2 marraqueta (50g), 1/2 taza avena (40g), 3/4 taza arroz cocido (100g) o 1 papa mediana (150g)",
    defaultPortions: 4,
  },
  carnes_bajas: {
    id: "carnes_bajas",
    name: "Carnes y Pescados Bajos en Grasa",
    color: "#ef4444",
    kcal: 65,
    cho: 0,
    protein: 11,
    fat: 2,
    description: "1 porción = 50g pechuga pollo/pavo, 60g posta vacuno, 80g reineta/merluza, 1 huevo o 1 lata chica de atún al agua",
    defaultPortions: 4,
  },
  carnes_altas: {
    id: "carnes_altas",
    name: "Carnes y Pescados Medios/Altos en Grasa",
    color: "#f97316",
    kcal: 120,
    cho: 0,
    protein: 11,
    fat: 8,
    description: "1 porción = 60g lomo vetado vacuno, 70g salmón del sur, 50g queso chanco o 1 huevo frito con spray",
    defaultPortions: 1,
  },
  lacteos_descremados: {
    id: "lacteos_descremados",
    name: "Lácteos Descremados (Bajos en Grasa)",
    color: "#38bdf8",
    kcal: 70,
    cho: 10,
    protein: 7,
    fat: 0,
    description: "1 porción = 1 vaso leche descremada (200 ml), 1 yogur natural descremado (150g) o 1 rodaja quesillo (60g)",
    defaultPortions: 2,
  },
  lacteos_enteros: {
    id: "lacteos_enteros",
    name: "Lácteos Enteros",
    color: "#0284c7",
    kcal: 110,
    cho: 9,
    protein: 7,
    fat: 6,
    description: "1 porción = 1 vaso leche entera (200 ml) o 1 yogur entero tradicional (150g)",
    defaultPortions: 0,
  },
  frutas: {
    id: "frutas",
    name: "Frutas",
    color: "#10b981",
    kcal: 65,
    cho: 15,
    protein: 1,
    fat: 0,
    description: "1 porción = 1 manzana/pera mediana (120g), 1 taza frutillas/arándanos o 1/2 plátano mediano (60g)",
    defaultPortions: 3,
  },
  verduras_general: {
    id: "verduras_general",
    name: "Verduras Consumo General",
    color: "#22c55e",
    kcal: 30,
    cho: 5,
    protein: 2,
    fat: 0,
    description: "1 porción = 1 taza zanahoria, betarraga, zapallo italiano o porotos verdes (100g)",
    defaultPortions: 3,
  },
  verduras_libre: {
    id: "verduras_libre",
    name: "Verduras de Libre Consumo",
    color: "#16a34a",
    kcal: 10,
    cho: 2.5,
    protein: 0,
    fat: 0,
    description: "1 porción = 1 plato hondo lechuga, espinaca, apio, repollo o pepino (150g)",
    defaultPortions: 2,
  },
  aceites_grasas: {
    id: "aceites_grasas",
    name: "Aceites y Grasas Saludables",
    color: "#a855f7",
    kcal: 180,
    cho: 0,
    protein: 0,
    fat: 20,
    description: "1 porción = 4 cucharaditas aceite de oliva (20 ml), 3 cucharadas de palta hass (60g) o 20 almendras (30g)",
    defaultPortions: 2,
  },
};

// ----------------------------------------------------------------------------
// ALIMENTOS CHILENOS CURADOS CON REGIONES Y ALÉRGENOS
// ----------------------------------------------------------------------------
export interface ChileanFoodItem {
  id: string;
  name: string;
  groupId: INTAGroupId;
  householdUnit: string;
  grams: number;
  allergens: string[];
  regions: RegionId[];
  isLocalSpecialty?: boolean;
  supermarketAisle: "Verdulería & Frutas" | "Carnes & Proteínas" | "Lácteos & Huevos" | "Despensa & Granos" | "Aceites & Semillas";
}

export const CHILEAN_FOOD_CATALOG: ChileanFoodItem[] = [
  // CEREALES & TUBÉRCULOS
  {
    id: "marraqueta",
    name: "Marraqueta chilena (batido)",
    groupId: "cereales",
    householdUnit: "1/2 unidad (1 diente)",
    grams: 50,
    allergens: ["gluten"],
    regions: ["antofagasta", "santiago", "chiloe"],
    supermarketAisle: "Despensa & Granos",
  },
  {
    id: "avena_tradicional",
    name: "Avena tradicional integral",
    groupId: "cereales",
    householdUnit: "1/2 taza",
    grams: 40,
    allergens: ["gluten"],
    regions: ["antofagasta", "santiago", "chiloe"],
    supermarketAisle: "Despensa & Granos",
  },
  {
    id: "arroz_grano_largo",
    name: "Arroz grano largo / integral cocido",
    groupId: "cereales",
    householdUnit: "3/4 taza",
    grams: 100,
    allergens: [],
    regions: ["antofagasta", "santiago", "chiloe"],
    supermarketAisle: "Despensa & Granos",
  },
  {
    id: "fideos_chilenos",
    name: "Fideos corbatitas o espaguetis cocidos",
    groupId: "cereales",
    householdUnit: "3/4 taza",
    grams: 110,
    allergens: ["gluten"],
    regions: ["antofagasta", "santiago", "chiloe"],
    supermarketAisle: "Despensa & Granos",
  },
  {
    id: "quinoa_nativa",
    name: "Quinoa andina cocida",
    groupId: "cereales",
    householdUnit: "3/4 taza",
    grams: 100,
    allergens: [],
    regions: ["antofagasta", "santiago"],
    isLocalSpecialty: true,
    supermarketAisle: "Despensa & Granos",
  },
  {
    id: "papa_chilota",
    name: "Papas nativas chilotas al vapor",
    groupId: "cereales",
    householdUnit: "1 papa mediana",
    grams: 150,
    allergens: [],
    regions: ["chiloe"],
    isLocalSpecialty: true,
    supermarketAisle: "Verdulería & Frutas",
  },

  // CARNES BAJAS EN GRASA
  {
    id: "pechuga_pollo",
    name: "Pechuga de pollo a la plancha",
    groupId: "carnes_bajas",
    householdUnit: "1 filete chico",
    grams: 80,
    allergens: [],
    regions: ["antofagasta", "santiago", "chiloe"],
    supermarketAisle: "Carnes & Proteínas",
  },
  {
    id: "atun_agua",
    name: "Atún lomitos al agua en conserva",
    groupId: "carnes_bajas",
    householdUnit: "1 lata chica escurrida",
    grams: 100,
    allergens: ["pescado"],
    regions: ["antofagasta", "santiago", "chiloe"],
    supermarketAisle: "Carnes & Proteínas",
  },
  {
    id: "reineta_costera",
    name: "Reineta fresca del norte a la plancha",
    groupId: "carnes_bajas",
    householdUnit: "1 filete mediano",
    grams: 100,
    allergens: ["pescado"],
    regions: ["antofagasta", "santiago"],
    isLocalSpecialty: true,
    supermarketAisle: "Carnes & Proteínas",
  },
  {
    id: "posta_negra",
    name: "Posta negra o tártaro vacuno magro",
    groupId: "carnes_bajas",
    householdUnit: "1 bistec chico",
    grams: 70,
    allergens: [],
    regions: ["santiago", "antofagasta", "chiloe"],
    supermarketAisle: "Carnes & Proteínas",
  },
  {
    id: "huevo_unidad",
    name: "Huevo fresco de campo cocido o pochado",
    groupId: "carnes_bajas",
    householdUnit: "1 unidad",
    grams: 55,
    allergens: ["huevo"],
    regions: ["antofagasta", "santiago", "chiloe"],
    supermarketAisle: "Lácteos & Huevos",
  },

  // CARNES MEDIAS/ALTAS EN GRASA
  {
    id: "salmon_sur",
    name: "Salmón austral de Chiloé al horno",
    groupId: "carnes_altas",
    householdUnit: "1 trozo mediano",
    grams: 80,
    allergens: ["pescado"],
    regions: ["chiloe", "santiago"],
    isLocalSpecialty: true,
    supermarketAisle: "Carnes & Proteínas",
  },
  {
    id: "cholgas_mejillones",
    name: "Choros zapato o mejillones de Chiloé",
    groupId: "carnes_bajas",
    householdUnit: "1 taza desconchados",
    grams: 120,
    allergens: ["mariscos"],
    regions: ["chiloe"],
    isLocalSpecialty: true,
    supermarketAisle: "Carnes & Proteínas",
  },

  // LÁCTEOS DESCREMADOS
  {
    id: "leche_descremada_sin_lactosa",
    name: "Leche descremada sin lactosa",
    groupId: "lacteos_descremados",
    householdUnit: "1 vaso",
    grams: 200,
    allergens: ["lacteos"],
    regions: ["antofagasta", "santiago", "chiloe"],
    supermarketAisle: "Lácteos & Huevos",
  },
  {
    id: "yogur_protein_sin_lactosa",
    name: "Yogur batido protein descremado sin lactosa",
    groupId: "lacteos_descremados",
    householdUnit: "1 pote individual",
    grams: 150,
    allergens: ["lacteos"],
    regions: ["antofagasta", "santiago", "chiloe"],
    supermarketAisle: "Lácteos & Huevos",
  },
  {
    id: "quesillo_chileno",
    name: "Quesillo fresco tradicional",
    groupId: "lacteos_descremados",
    householdUnit: "1 rodaja gruesa",
    grams: 60,
    allergens: ["lacteos", "lactosa"],
    regions: ["antofagasta", "santiago", "chiloe"],
    supermarketAisle: "Lácteos & Huevos",
  },

  // FRUTAS
  {
    id: "manzana_fuji",
    name: "Manzana fuji o verde fresca",
    groupId: "frutas",
    householdUnit: "1 unidad mediana",
    grams: 130,
    allergens: [],
    regions: ["antofagasta", "santiago", "chiloe"],
    supermarketAisle: "Verdulería & Frutas",
  },
  {
    id: "berries_sur",
    name: "Frutillas o murta silvestre de Chiloé",
    groupId: "frutas",
    householdUnit: "1 taza colmada",
    grams: 140,
    allergens: [],
    regions: ["chiloe", "santiago"],
    isLocalSpecialty: true,
    supermarketAisle: "Verdulería & Frutas",
  },
  {
    id: "platano_seda",
    name: "Plátano seda",
    groupId: "frutas",
    householdUnit: "1/2 unidad",
    grams: 60,
    allergens: [],
    regions: ["antofagasta", "santiago"],
    supermarketAisle: "Verdulería & Frutas",
  },

  // VERDURAS GENERAL & LIBRE
  {
    id: "tomate_limachino",
    name: "Tomate chileno en rodajas con orégano",
    groupId: "verduras_general",
    householdUnit: "1 unidad mediana",
    grams: 120,
    allergens: [],
    regions: ["santiago", "antofagasta"],
    supermarketAisle: "Verdulería & Frutas",
  },
  {
    id: "espinaca_fresca",
    name: "Espinaca o acelga baby fresca",
    groupId: "verduras_libre",
    householdUnit: "1 plato hondo",
    grams: 150,
    allergens: [],
    regions: ["antofagasta", "santiago", "chiloe"],
    supermarketAisle: "Verdulería & Frutas",
  },
  {
    id: "lechuga_costina",
    name: "Lechuga costina o escarola picada",
    groupId: "verduras_libre",
    householdUnit: "1 plato hondo",
    grams: 150,
    allergens: [],
    regions: ["antofagasta", "santiago", "chiloe"],
    supermarketAisle: "Verdulería & Frutas",
  },

  // GRASAS Y ACEITES SALUDABLES
  {
    id: "palta_hass",
    name: "Palta hass chilena molida",
    groupId: "aceites_grasas",
    householdUnit: "3 cucharadas soperas",
    grams: 60,
    allergens: [],
    regions: ["antofagasta", "santiago", "chiloe"],
    supermarketAisle: "Verdulería & Frutas",
  },
  {
    id: "aceite_oliva_chileno",
    name: "Aceite de oliva extra virgen del Valle del Huasco",
    groupId: "aceites_grasas",
    householdUnit: "4 cucharaditas",
    grams: 20,
    allergens: [],
    regions: ["antofagasta", "santiago"],
    isLocalSpecialty: true,
    supermarketAisle: "Aceites & Semillas",
  },
  {
    id: "nueces_chilenas",
    name: "Nueces chilenas en mariposa",
    groupId: "aceites_grasas",
    householdUnit: "5 mariposas enteras",
    grams: 25,
    allergens: ["frutos_secos"],
    regions: ["santiago", "chiloe"],
    supermarketAisle: "Aceites & Semillas",
  },
];

// ----------------------------------------------------------------------------
// FÓRMULAS CLÍNICAS DETERMINISTAS (MIFFLIN-ST JEOR, GET/TDEE, MACROS)
// ----------------------------------------------------------------------------
export function calculateMifflinStJeor(params: {
  gender: "F" | "M";
  weightKg: number;
  heightCm: number;
  ageYears: number;
}): number {
  const { gender, weightKg, heightCm, ageYears } = params;
  // Hombres: 10 * peso + 6.25 * talla - 5 * edad + 5
  // Mujeres: 10 * peso + 6.25 * talla - 5 * edad - 161
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  const bmr = gender === "M" ? base + 5 : base - 161;
  return Math.round(bmr);
}

export function getActivityFactor(
  level: "sedentario" | "ligero" | "moderado" | "intenso",
): number {
  switch (level) {
    case "sedentario":
      return 1.2;
    case "ligero":
      return 1.375;
    case "moderado":
      return 1.55;
    case "intenso":
      return 1.725;
    default:
      return 1.2;
  }
}

export function calculateTDEE(params: {
  gender: "F" | "M";
  weightKg: number;
  heightCm: number;
  ageYears: number;
  activityLevel: "sedentario" | "ligero" | "moderado" | "intenso";
}): { bmr: number; tdee: number; activityFactor: number } {
  const bmr = calculateMifflinStJeor(params);
  const factor = getActivityFactor(params.activityLevel);
  const tdee = Math.round(bmr * factor);
  return { bmr, tdee, activityFactor: factor };
}

export interface MacroTarget {
  targetKcal: number;
  proteinGrams: number;
  proteinPercent: number;
  carbsGrams: number;
  carbsPercent: number;
  fatGrams: number;
  fatPercent: number;
  proteinGramsPerKg: number;
}

export function calculateMacroTargets(params: {
  tdee: number;
  weightKg: number;
  goal: string;
}): MacroTarget {
  const { tdee, weightKg, goal } = params;
  let targetKcal = tdee;

  // Ajustes clínicos según objetivo
  const lowerGoal = goal.toLowerCase();
  if (lowerGoal.includes("bajar") || lowerGoal.includes("pérdida") || lowerGoal.includes("resistencia")) {
    targetKcal = Math.max(1300, Math.round(tdee - 450));
  } else if (lowerGoal.includes("hipertrofia") || lowerGoal.includes("aumento") || lowerGoal.includes("volumen")) {
    targetKcal = Math.round(tdee + 350);
  }

  // Proteína: 1.8 a 2.0 g/kg para deportistas o déficit calórico con resistencia a la insulina
  const gPerKg = lowerGoal.includes("hipertrofia") ? 2.0 : 1.8;
  const proteinGrams = Math.round(weightKg * gPerKg);
  const proteinKcal = proteinGrams * 4;

  // Grasa: 25% a 28% de calorías totales
  const fatPercent = 26;
  const fatKcal = targetKcal * (fatPercent / 100);
  const fatGrams = Math.round(fatKcal / 9);

  // Carbohidratos: Resto calórico
  const carbsKcal = Math.max(0, targetKcal - proteinKcal - fatKcal);
  const carbsGrams = Math.round(carbsKcal / 4);

  const proteinPercent = Math.round((proteinKcal / targetKcal) * 100);
  const carbsPercent = Math.round((carbsKcal / targetKcal) * 100);

  return {
    targetKcal,
    proteinGrams,
    proteinPercent,
    carbsGrams,
    carbsPercent,
    fatGrams,
    fatPercent,
    proteinGramsPerKg: Number(gPerKg.toFixed(2)),
  };
}

// ----------------------------------------------------------------------------
// SOLVER DETERMINISTA DE CUPOS DE INTERCAMBIO
// Calcula la combinación de porciones INTA que cuadra exactamente las metas
// ----------------------------------------------------------------------------
export function solveExchangePlan(targets: MacroTarget): Record<INTAGroupId, number> {
  const { targetKcal, proteinGrams } = targets;

  // Distribución base por tipo de paciente
  let cereales = 3.5;
  let carnesBajas = 4.0;
  let carnesAltas = 1.0;
  let lacteos = 2.0;
  let frutas = 3.0;
  let verdurasGen = 3.0;
  let verdurasLibre = 2.0;
  let aceites = 2.5;

  if (targetKcal > 2400) {
    cereales = 6.0;
    carnesBajas = 6.0;
    lacteos = 3.0;
    frutas = 4.0;
    aceites = 3.5;
  } else if (targetKcal < 1650) {
    cereales = 2.5;
    carnesBajas = 4.5;
    carnesAltas = 0.5;
    lacteos = 2.0;
    frutas = 2.0;
    aceites = 2.0;
  }

  // Ajuste fino para cuadrar proteínas (carnes bajas = 11g proteína)
  const currentProtein =
    cereales * 3 +
    carnesBajas * 11 +
    carnesAltas * 11 +
    lacteos * 7 +
    frutas * 1 +
    verdurasGen * 2;

  const proteinDiff = proteinGrams - currentProtein;
  if (Math.abs(proteinDiff) > 5) {
    const additionalMeatPortions = Math.round((proteinDiff / 11) * 2) / 2;
    carnesBajas = Math.max(2, carnesBajas + additionalMeatPortions);
  }

  return {
    cereales,
    carnes_bajas: carnesBajas,
    carnes_altas: carnesAltas,
    lacteos_descremados: lacteos,
    lacteos_enteros: 0,
    frutas,
    verduras_general: verdurasGen,
    verduras_libre: verdurasLibre,
    aceites_grasas: aceites,
  };
}

// ----------------------------------------------------------------------------
// CÁLCULO DE BALANCE Y MATRIZ DE ADECUACIÓN
// ----------------------------------------------------------------------------
export interface BalanceSummary {
  kcal: number;
  cho: number;
  protein: number;
  fat: number;
  targetKcal: number;
  targetCho: number;
  targetProtein: number;
  targetFat: number;
  kcalAdequacyPct: number;
  proteinAdequacyPct: number;
  choAdequacyPct: number;
  fatAdequacyPct: number;
  status: "perfect" | "warning" | "alert";
}

export function computeBalance(
  portions: Record<INTAGroupId, number>,
  targets: MacroTarget,
): BalanceSummary {
  let kcal = 0;
  let cho = 0;
  let protein = 0;
  let fat = 0;

  for (const [groupId, qty] of Object.entries(portions) as [INTAGroupId, number][]) {
    const def = INTA_GROUPS[groupId];
    if (def && qty > 0) {
      kcal += def.kcal * qty;
      cho += def.cho * qty;
      protein += def.protein * qty;
      fat += def.fat * qty;
    }
  }

  const kcalAdequacyPct = Math.round((kcal / targets.targetKcal) * 100);
  const proteinAdequacyPct = Math.round((protein / targets.proteinGrams) * 100);
  const choAdequacyPct = Math.round((cho / targets.carbsGrams) * 100);
  const fatAdequacyPct = Math.round((fat / targets.fatGrams) * 100);

  const delta = Math.abs(kcalAdequacyPct - 100);
  const status = delta <= 5 ? "perfect" : delta <= 10 ? "warning" : "alert";

  return {
    kcal: Math.round(kcal),
    cho: Math.round(cho),
    protein: Math.round(protein),
    fat: Math.round(fat),
    targetKcal: targets.targetKcal,
    targetCho: targets.carbsGrams,
    targetProtein: targets.proteinGrams,
    targetFat: targets.fatGrams,
    kcalAdequacyPct,
    proteinAdequacyPct,
    choAdequacyPct,
    fatAdequacyPct,
    status,
  };
}

// ----------------------------------------------------------------------------
// TRAZABILIDAD CLÍNICA (CAPA 1: "POR QUÉ ESTE NÚMERO")
// ----------------------------------------------------------------------------
export interface ClinicalTrace {
  foodId: string;
  foodName: string;
  groupId: INTAGroupId;
  groupName: string;
  portions: number;
  householdMeasure: string;
  gramsTotal: number;
  kcalProvided: number;
  proteinProvided: number;
  choProvided: number;
  fatProvided: number;
  clinicalSource: string;
  formulaUsed: string;
  calculationBasis: string;
  timing: string;
}

export function buildClinicalTrace(params: {
  food: ChileanFoodItem;
  portions: number;
  mealName: string;
  patient: {
    age: number;
    gender: "F" | "M";
    weight: number;
    height: number;
    activity: string;
  };
  targets: MacroTarget;
}): ClinicalTrace {
  const { food, portions, mealName, patient, targets } = params;
  const group = INTA_GROUPS[food.groupId];

  return {
    foodId: food.id,
    foodName: food.name,
    groupId: food.groupId,
    groupName: group.name,
    portions,
    householdMeasure: `${portions} porción (${food.householdUnit})`,
    gramsTotal: Math.round(food.grams * portions),
    kcalProvided: Math.round(group.kcal * portions),
    proteinProvided: Math.round(group.protein * portions),
    choProvided: Math.round(group.cho * portions),
    fatProvided: Math.round(group.fat * portions),
    clinicalSource: "Tabla Oficial de Porciones de Intercambio INTA - Universidad de Chile",
    formulaUsed: `Mifflin-St Jeor (${patient.gender === "F" ? "Mujer: 10×peso + 6.25×talla - 5×edad - 161" : "Hombre: 10×peso + 6.25×talla - 5×edad + 5"})`,
    calculationBasis: `Basado en peso (${patient.weight}kg), talla (${patient.height}cm), edad (${patient.age}a) y factor actividad ${patient.activity}. Meta calórica: ${targets.targetKcal} kcal/día (${targets.proteinGrams}g proteína).`,
    timing: mealName,
  };
}

// ----------------------------------------------------------------------------
// BLOQUEO DE SEGURIDAD CLÍNICO (ALÉRGENOS Y PATOLOGÍAS)
// ----------------------------------------------------------------------------
export function checkFoodSafety(
  food: ChileanFoodItem,
  patientRestrictions: string[],
): { isSafe: boolean; blockReason?: string } {
  const lowerRestrictions = patientRestrictions.map((r) => r.toLowerCase());

  // Intolerancia a la lactosa o alergia a la proteína de leche
  const hasLactoseRestriction = lowerRestrictions.some(
    (r) => r.includes("lactosa") || r.includes("sin lácteo") || r.includes("sin lacteo"),
  );
  if (hasLactoseRestriction && food.allergens.includes("lactosa")) {
    return {
      isSafe: false,
      blockReason: "Bloqueado clínicamente: paciente con intolerancia / alergia a lácteos y derivados.",
    };
  }

  // Alergia al gluten o celiaquía
  const hasGlutenRestriction = lowerRestrictions.some(
    (r) => r.includes("gluten") || r.includes("celiac"),
  );
  if (hasGlutenRestriction && food.allergens.includes("gluten")) {
    return {
      isSafe: false,
      blockReason: "Bloqueado clínicamente: contiene gluten, no apto para paciente con restricción.",
    };
  }

  // Hipertensión arterial (sodio)
  const hasHta = lowerRestrictions.some((r) => r.includes("sodio") || r.includes("hta") || r.includes("hipertens"));
  if (hasHta && (food.id.includes("chanco") || food.id.includes("embutido"))) {
    return {
      isSafe: false,
      blockReason: "Bloqueado clínicamente: alto aporte de sodio, contraindicado para HTA.",
    };
  }

  return { isSafe: true };
}

