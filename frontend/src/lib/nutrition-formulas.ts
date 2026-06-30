import {
  buildSuggestedExchangeRows,
  EXCHANGE_PORTION_PROFILES,
  type ExchangePortionProfile,
  type PatientExchangeGuideRow,
} from "@/lib/exchange-portions";
import {
  getMinsalBmiLms,
  type MinsalSex,
} from "@/lib/minsal-bmi-lms";

export type Gender = "Masculino" | "Femenino" | "Otro";

export type ActivityLevel =
  | "sedentario"
  | "ligero"
  | "moderado"
  | "activo"
  | "muy_activo";

export type TmbFormula = "harris-benedict" | "mifflin-st-jeor" | "oms-fao";

export type MacroTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  proteinPercent: number;
  carbsPercent: number;
  fatsPercent: number;
};

export type BmiResult = {
  bmi: number;
  classification: string;
  color: string;
  percentile?: number;
  percentileCategory?: string;
  reference?: string;
  note?: string;
  isPediatric?: boolean;
};

export type IdealWeightResult = {
  min: number;
  max: number;
  reference: string;
  percentile?: number;
  note?: string;
  supported?: boolean;
};

export type GetResult = {
  tmb: number;
  formula: TmbFormula;
  get: number;
  activityFactor: number;
  macros: MacroTargets;
};

export type PediatricPercentile = {
  percentile: number;
  zScore: number;
  classification: string;
};

export const ACTIVITY_FACTORS: Record<
  ActivityLevel,
  { factor: number; label: string; description: string }
> = {
  sedentario: {
    factor: 1.2,
    label: "Sedentario",
    description: "Oficina, poco o ningun ejercicio",
  },
  ligero: {
    factor: 1.375,
    label: "Ligero",
    description: "Ejercicio 1-3 dias por semana",
  },
  moderado: {
    factor: 1.55,
    label: "Moderado",
    description: "Ejercicio 3-5 dias por semana",
  },
  activo: {
    factor: 1.725,
    label: "Activo",
    description: "Ejercicio 6-7 dias por semana",
  },
  muy_activo: {
    factor: 1.9,
    label: "Muy activo",
    description: "Atleta o trabajo fisico pesado",
  },
};

export const BMI_CLASSIFICATIONS = [
  { min: 0, max: 18.5, label: "Bajo peso", color: "#3b82f6" },
  { min: 18.5, max: 25, label: "Normopeso", color: "#22c55e" },
  { min: 25, max: 30, label: "Sobrepeso", color: "#eab308" },
  { min: 30, max: 35, label: "Obesidad I", color: "#f97316" },
  { min: 35, max: 40, label: "Obesidad II", color: "#ef4444" },
  { min: 40, max: 999, label: "Obesidad III", color: "#b91c1c" },
];

export const MACRO_RANGES = {
  carbs: { min: 0.45, max: 0.65, default: 0.55, kcalPerGram: 4 },
  protein: { min: 0.1, max: 0.35, default: 0.2, kcalPerGram: 4 },
  fats: { min: 0.2, max: 0.35, default: 0.25, kcalPerGram: 9 },
};

export const PHYSIOLOGICAL_ADJUSTMENTS = [
  {
    id: "pregnancy_t2",
    label: "Embarazo 2do trimestre",
    kcal: 340,
    desc: "+340 kcal/dia sobre GET",
  },
  {
    id: "pregnancy_t3",
    label: "Embarazo 3er trimestre",
    kcal: 450,
    desc: "+450 kcal/dia sobre GET",
  },
  {
    id: "lactation_full",
    label: "Lactancia exclusiva",
    kcal: 500,
    desc: "+500 kcal/dia sobre GET",
  },
  {
    id: "lactation_partial",
    label: "Lactancia parcial",
    kcal: 300,
    desc: "+300 kcal/dia sobre GET",
  },
  {
    id: "weight_gain",
    label: "Ganancia de peso",
    kcal: 500,
    desc: "+500 kcal/dia (0.5 kg/semana)",
  },
  {
    id: "weight_loss",
    label: "Perdida de peso",
    kcal: -500,
    desc: "-500 kcal/dia (0.5 kg/semana)",
  },
  {
    id: "elderly",
    label: "Adulto mayor (>65)",
    factor: 0.9,
    desc: "Metabolismo reducido (x0.9)",
  },
  {
    id: "critical",
    label: "Paciente critico",
    factor: 1.3,
    desc: "Estres metabolico (x1.2 a x1.5)",
  },
];

export function calculateAge(birthDate?: string | null): number | undefined {
  if (!birthDate) return undefined;
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < date.getDate())
  ) {
    age -= 1;
  }
  return age >= 0 ? age : undefined;
}

export function isPediatric(birthDate?: string | null): boolean {
  const age = calculateAge(birthDate);
  return age !== undefined && age < 18;
}

function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const prob =
    d *
    (((((1.330274429 * t - 1.821255978) * t + 1.781477937) * t - 0.356563782) * t + 0.31938153) * t);
  return z > 0 ? 1 - prob : prob;
}

function percentileFromZ(z: number): number {
  return Math.min(99.9, Math.max(0.1, normalCdf(z) * 100));
}

function resolveSex(gender?: Gender | null): MinsalSex | null {
  if (gender === "Femenino") return "female";
  if (gender === "Masculino") return "male";
  return null;
}

function getPediatricBmiAssessment(params: {
  bmi: number;
  ageYears?: number | null;
  birthDate?: string | null;
  gender?: Gender | null;
}): BmiResult | null {
  const resolvedAge =
    typeof params.ageYears === "number"
      ? params.ageYears
      : calculateAge(params.birthDate || null);
  const sex = resolveSex(params.gender);

  if (resolvedAge === undefined || !sex) return null;

  const ageMonths = Math.round((resolvedAge ?? 0) * 12);

  if (resolvedAge < 5) {
    return {
      bmi: Math.round(params.bmi * 10) / 10,
      classification: "Requiere curva peso/talla MINSAL",
      color: "#f59e0b",
      isPediatric: true,
      note:
        "Menores de 5 años deben evaluarse con peso/talla y referencias pediátricas específicas.",
      reference: "Peso/talla MINSAL 0-4 años",
    };
  }

  const lms = getMinsalBmiLms(sex, ageMonths);
  if (!lms) return null;

  const z =
    lms.L === 0
      ? Math.log(params.bmi / lms.M) / lms.S
      : (Math.pow(params.bmi / lms.M, lms.L) - 1) / (lms.L * lms.S);
  const percentile = percentileFromZ(z);

  let classification = "Normopeso";
  let color = "#22c55e";
  if (percentile < 10) {
    classification = "Bajo peso";
    color = "#3b82f6";
  } else if (percentile < 85) {
    classification = "Normopeso";
    color = "#22c55e";
  } else if (percentile < 95) {
    classification = "Sobrepeso";
    color = "#eab308";
  } else {
    classification = "Obesidad";
    color = "#f97316";
  }

  return {
    bmi: Math.round(params.bmi * 10) / 10,
    classification,
    color,
    percentile: Math.round(percentile * 10) / 10,
    percentileCategory:
      percentile < 10
        ? "<p10"
        : percentile < 85
          ? "p10-p85"
          : percentile < 95
            ? "p85-p95"
            : ">p95",
    reference: "MINSAL IMC/E 5-19 años",
    isPediatric: true,
  };
}

export function calculateBMI(
  weightKg?: number | null,
  heightCm?: number | null,
  options: {
    gender?: Gender | null;
    ageYears?: number | null;
    birthDate?: string | null;
  } = {},
): BmiResult | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  const pediatric = getPediatricBmiAssessment({
    bmi,
    ageYears: options.ageYears,
    birthDate: options.birthDate,
    gender: options.gender || null,
  });

  if (pediatric) {
    return pediatric;
  }

  const classification =
    BMI_CLASSIFICATIONS.find((item) => bmi >= item.min && bmi < item.max) ||
    BMI_CLASSIFICATIONS[BMI_CLASSIFICATIONS.length - 1];
  return {
    bmi: Math.round(bmi * 10) / 10,
    classification: classification.label,
    color: classification.color,
    isPediatric: false,
  };
}

export function getIdealWeightRange(
  heightCm?: number | null,
  options: {
    gender?: Gender | null;
    ageYears?: number | null;
    birthDate?: string | null;
  } = {},
): IdealWeightResult | null {
  if (!heightCm || heightCm <= 0) return null;
  const heightMeters = heightCm / 100;

  const resolvedAge =
    typeof options.ageYears === "number"
      ? options.ageYears
      : calculateAge(options.birthDate || null);
  const resolvedGender =
    options.gender === "Masculino" || options.gender === "Femenino"
      ? options.gender
      : null;

  if (typeof resolvedAge === "number" && resolvedAge < 5) {
    return {
      min: 0,
      max: 0,
      reference: "Peso/talla MINSAL 0-4 años",
      note: "En menores de 5 años se evalúa con curvas peso/talla, no con IMC/edad.",
      supported: false,
    };
  }

  if (typeof resolvedAge === "number" && resolvedAge < 18) {
    const sex = resolveSex(resolvedGender);
    if (!sex) {
      return {
        min: 0,
        max: 0,
        reference: "IMC p50 MINSAL",
        note: "Ingresa sexo para estimar el peso ideal pediátrico.",
        supported: false,
      };
    }

    const ageMonths = Math.round((resolvedAge || 0) * 12);
    const lms = getMinsalBmiLms(sex, ageMonths);
    if (!lms) {
      return {
        min: 0,
        max: 0,
        reference: "IMC p50 MINSAL",
        note: "Curva pediátrica disponible solo para 5 a 19 años en esta versión.",
        supported: false,
      };
    }

    const ideal = lms.M * heightMeters * heightMeters;
    return {
      min: Math.round(ideal * 0.95 * 10) / 10,
      max: Math.round(ideal * 1.05 * 10) / 10,
      reference: sex === "female" ? "IMC p50 MINSAL (niñas)" : "IMC p50 MINSAL (niños)",
      percentile: 50,
      note: "Referencia IMC/Edad MINSAL para 5 a 19 años.",
      supported: true,
    };
  }

  if (typeof resolvedAge === "number" && resolvedAge > 65) {
    return {
      min: Math.round(23 * heightMeters * heightMeters * 10) / 10,
      max: Math.round(28 * heightMeters * heightMeters * 10) / 10,
      reference: "IMC objetivo 23-28",
      note: "Adulto mayor (>65 años).",
      supported: true,
    };
  }

  const targetBmi = resolvedGender === "Masculino" ? 22.5 : 21.5;
  const ideal = targetBmi * heightMeters * heightMeters;
  return {
    min: Math.round(ideal * 0.97 * 10) / 10,
    max: Math.round(ideal * 1.03 * 10) / 10,
    reference: resolvedGender === "Masculino" ? "IMC 22.5" : "IMC 21.5",
    note: "Rango estimado para adulto.",
    supported: true,
  };
}

export function calculateTMB(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  ageYears: number,
  formula: TmbFormula = "mifflin-st-jeor",
): number | null {
  if (weightKg <= 0 || heightCm <= 0 || ageYears < 0) return null;

  switch (formula) {
    case "harris-benedict":
      return gender === "Masculino"
        ? 66.5 + 13.75 * weightKg + 5.003 * heightCm - 6.775 * ageYears
        : 655.1 + 9.563 * weightKg + 1.85 * heightCm - 4.676 * ageYears;
    case "mifflin-st-jeor":
      return gender === "Masculino"
        ? 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
    case "oms-fao": {
      const weight = weightKg;
      if (gender === "Masculino") {
        if (ageYears < 3) return 60.9 * weight - 54;
        if (ageYears < 10) return 22.7 * weight + 495;
        if (ageYears < 18) return 17.5 * weight + 651;
        if (ageYears < 30) return 15.3 * weight + 679;
        if (ageYears < 60) return 11.6 * weight + 879;
        return 13.5 * weight + 487;
      }
      if (ageYears < 3) return 61 * weight - 51;
      if (ageYears < 10) return 22.5 * weight + 499;
      if (ageYears < 18) return 12.2 * weight + 746;
      if (ageYears < 30) return 14.7 * weight + 496;
      if (ageYears < 60) return 8.7 * weight + 829;
      return 10.5 * weight + 596;
    }
    default:
      return null;
  }
}

export function calculateGET(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  ageYears: number,
  activityLevel: ActivityLevel,
  formula: TmbFormula = "mifflin-st-jeor",
  adjustments: string[] = [],
): GetResult | null {
  const tmb = calculateTMB(gender, weightKg, heightCm, ageYears, formula);
  if (tmb === null) return null;

  const baseActivityFactor = ACTIVITY_FACTORS[activityLevel]?.factor ?? 1.2;
  let activityFactor = baseActivityFactor;
  let get = tmb * baseActivityFactor;

  for (const adjustmentId of adjustments) {
    const adjustment = PHYSIOLOGICAL_ADJUSTMENTS.find(
      (item) => item.id === adjustmentId,
    );
    if (!adjustment) continue;
    if (adjustment.factor) {
      get *= adjustment.factor;
      activityFactor *= adjustment.factor;
    }
    if (adjustment.kcal) {
      get += adjustment.kcal;
    }
  }

  const macros = calculateMacros(Math.round(get));

  return {
    tmb: Math.round(tmb),
    formula,
    get: Math.round(get),
    activityFactor: Math.round(activityFactor * 1000) / 1000,
    macros,
  };
}

export function calculateMacros(
  calories: number,
  carbPercent = MACRO_RANGES.carbs.default,
  proteinPercent = MACRO_RANGES.protein.default,
  fatPercent = MACRO_RANGES.fats.default,
): MacroTargets {
  const protein = Math.round((calories * proteinPercent) / 4);
  const carbs = Math.round((calories * carbPercent) / 4);
  const fats = Math.round((calories * fatPercent) / 9);

  return {
    calories: Math.round(calories),
    protein,
    carbs,
    fats,
    proteinPercent: Math.round(proteinPercent * 100),
    carbsPercent: Math.round(carbPercent * 100),
    fatsPercent: Math.round(fatPercent * 100),
  };
}

export function getMacroPctFromGrams(
  calories: number,
  protein: number,
  carbs: number,
  fats: number,
) {
  if (calories <= 0) {
    return { proteinPercent: 20, carbsPercent: 55, fatsPercent: 25 };
  }
  return {
    proteinPercent: Math.round(((protein * 4) / calories) * 100),
    carbsPercent: Math.round(((carbs * 4) / calories) * 100),
    fatsPercent: Math.round(((fats * 9) / calories) * 100),
  };
}

export type ExchangePortion = {
  category: string;
  amount: string;
  cho: number;
  protein: number;
  fat: number;
  kcal: number;
};

export const EXCHANGE_PORTIONS: ExchangePortion[] = EXCHANGE_PORTION_PROFILES
  .filter((profile) => profile.isClinicalExchange)
  .map((profile) => ({
    category: profile.label,
    amount: profile.householdPortion,
    cho: profile.cho,
    protein: profile.protein,
    fat: profile.fat,
    kcal: profile.kcal,
  }));

export { EXCHANGE_PORTION_PROFILES };
export type { ExchangePortionProfile, PatientExchangeGuideRow };

export function calculateExchangePortions(macros: MacroTargets) {
  return buildSuggestedExchangeRows(macros);
}

export function calculateAllFromPatient(params: {
  gender?: string | null;
  weight?: number | null;
  height?: number | null;
  birthDate?: string | null;
  activityLevel?: string | null;
  adjustments?: string[];
  tmbFormula?: TmbFormula;
}) {
  const gender: Gender =
    params.gender === "Masculino" || params.gender === "Femenino"
      ? (params.gender as Gender)
      : "Femenino";

  const weight = params.weight || 0;
  const height = params.height || 0;
  const age = calculateAge(params.birthDate) || 30;
  const activity = (
    params.activityLevel as ActivityLevel | null | undefined
  ) || "sedentario";
  const formula = params.tmbFormula || "mifflin-st-jeor";

  const bmi = calculateBMI(weight, height);
  const idealWeight = getIdealWeightRange(height, {
    gender,
    ageYears: age,
    birthDate: params.birthDate || null,
  });
  const get = calculateGET(
    gender,
    weight,
    height,
    age,
    activity,
    formula,
    params.adjustments || [],
  );
  const pediatric = isPediatric(params.birthDate);

  return { bmi, idealWeight, get, pediatric, age };
}
