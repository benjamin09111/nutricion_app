type PatientAiConsultation = {
  date?: Date | string | null;
  title?: string | null;
  description?: string | null;
  plansDelivered?: boolean | null;
};

type PatientAiCustomVariable = {
  key?: string | null;
  value?: unknown;
};

type PatientAiClinicalRecord = {
  vitalHistory?: unknown;
  gynecoObstetric?: unknown;
  nutritionalAnamnesis?: unknown;
  anthropometry?: unknown;
  dataSources?: unknown;
};

export type PatientAiContextSource = {
  age?: number | null;
  birthDate?: Date | string | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  activityLevel?: string | null;
  nutritionalFocus?: string | null;
  fitnessGoals?: string | null;
  primaryCondition?: string | null;
  clinicalSummary?: string | null;
  dietRestrictions?: unknown;
  likes?: string | null;
  customVariables?: unknown;
  clinicalRecord?: PatientAiClinicalRecord | null;
  consultations?: PatientAiConsultation[] | null;
};

export type PatientAiContext = {
  schemaVersion: string;
  generatedAt: string;
  demographics?: {
    ageYears?: number;
    sex?: string;
    activityLevel?: string;
    isPediatric?: boolean;
    isPregnant?: boolean;
  };
  anthropometry?: {
    weightKg?: number;
    heightCm?: number;
    bmi?: number;
    bmiClassification?: string;
  };
  goals?: {
    nutritionalFocus?: string;
    fitnessGoals?: string;
    primaryCondition?: string;
  };
  clinical?: Record<string, unknown>;
  nutrition?: Record<string, unknown>;
  calculatedNutrition?: Record<string, unknown>;
  recentConsultations?: Array<{
    date?: string;
    title?: string;
    description?: string;
    plansDelivered?: boolean;
  }>;
  riskFlags: string[];
  missingCriticalData: string[];
};

function trimText(value: unknown, maxLength = 240) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1)}…` : trimmed;
}

function toPositiveNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function calculateAgeYears(age?: number | null, birthDate?: Date | string | null) {
  const storedAge = toPositiveNumber(age);
  if (storedAge !== undefined) return Math.round(storedAge);

  if (!birthDate) return undefined;

  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return undefined;

  const today = new Date();
  let years = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < date.getDate())
  ) {
    years -= 1;
  }

  return years >= 0 ? years : undefined;
}

function calculateBmi(weight?: number | null, height?: number | null) {
  const validWeight = toPositiveNumber(weight);
  const validHeight = toPositiveNumber(height);
  if (validWeight === undefined || validHeight === undefined) return undefined;

  const meters = validHeight / 100;
  if (meters <= 0) return undefined;

  const bmi = validWeight / (meters * meters);
  return Math.round(bmi * 10) / 10;
}

function classifyBmi(bmi?: number) {
  if (bmi === undefined) return undefined;
  if (bmi < 18.5) return 'Bajo peso';
  if (bmi < 25) return 'Normopeso';
  if (bmi < 30) return 'Sobrepeso';
  if (bmi < 35) return 'Obesidad I';
  if (bmi < 40) return 'Obesidad II';
  return 'Obesidad III';
}

function compactValue(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    const compacted = value
      .map((item) => compactValue(item))
      .filter((item) => item !== undefined);
    return compacted.length > 0 ? compacted : undefined;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, compactValue(item)] as const)
      .filter(([, item]) => item !== undefined);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  return value;
}

function getAutomaticNutritionCalculations(customVariables: unknown) {
  if (!Array.isArray(customVariables)) return undefined;

  const match = customVariables.find((item: any) => {
    const key = String(item?.key || '').toLowerCase();
    return key === 'automaticnutritioncalculations';
  }) as PatientAiCustomVariable | undefined;

  return compactValue(match?.value) as Record<string, unknown> | undefined;
}

function normalizeDietRestrictions(dietRestrictions: unknown) {
  if (!Array.isArray(dietRestrictions)) return undefined;
  const items = dietRestrictions
    .map((item) => trimText(item, 120))
    .filter((item): item is string => Boolean(item));
  return items.length > 0 ? items : undefined;
}

function summarizeConsultations(consultations?: PatientAiConsultation[] | null) {
  if (!Array.isArray(consultations) || consultations.length === 0) return undefined;

  return consultations.slice(0, 3).map((consultation) => ({
    date:
      consultation.date instanceof Date
        ? consultation.date.toISOString()
        : typeof consultation.date === 'string'
          ? consultation.date
          : undefined,
    title: trimText(consultation.title, 120),
    description: trimText(consultation.description, 220),
    plansDelivered: consultation.plansDelivered ?? undefined,
  }));
}

export function buildPatientAiContext(
  source: PatientAiContextSource,
): PatientAiContext {
  const ageYears = calculateAgeYears(source.age, source.birthDate);
  const bmi = calculateBmi(source.weight, source.height);
  const automaticNutrition = getAutomaticNutritionCalculations(
    source.customVariables,
  );
  const clinicalRecord = compactValue({
    vitalHistory: source.clinicalRecord?.vitalHistory,
    gynecoObstetric: source.clinicalRecord?.gynecoObstetric,
    nutritionalAnamnesis: source.clinicalRecord?.nutritionalAnamnesis,
    anthropometry: source.clinicalRecord?.anthropometry,
    dataSources: source.clinicalRecord?.dataSources,
  }) as Record<string, unknown> | undefined;

  const gynecoObstetric =
    (clinicalRecord?.gynecoObstetric as Record<string, unknown> | undefined) ||
    undefined;
  const isPregnant = Boolean(gynecoObstetric?.isPregnant);

  const riskFlags: string[] = [];
  if (normalizeDietRestrictions(source.dietRestrictions)?.length) {
    riskFlags.push('Restricciones alimentarias registradas');
  }
  if (source.primaryCondition) {
    riskFlags.push(`Condición principal: ${source.primaryCondition.trim()}`);
  }
  if (isPregnant) {
    riskFlags.push('Embarazo en curso');
  }
  if (automaticNutrition?.status === 'SUGGESTED_REVIEW_REQUIRED') {
    riskFlags.push('Cálculos automáticos requieren revisión profesional');
  }

  const criticalMissing: string[] = [];
  if (ageYears === undefined) criticalMissing.push('edad');
  if (!source.gender) criticalMissing.push('sexo');
  if (toPositiveNumber(source.weight) === undefined) criticalMissing.push('peso');
  if (toPositiveNumber(source.height) === undefined) criticalMissing.push('talla');
  if (!source.activityLevel) criticalMissing.push('nivel de actividad');

  const clinicalSection = compactValue({
    clinicalSummary: source.clinicalSummary,
    primaryCondition: source.primaryCondition,
    clinicalRecord,
  }) as Record<string, unknown> | undefined;

  const nutritionSection = compactValue({
    dietRestrictions: normalizeDietRestrictions(source.dietRestrictions),
    likes: source.likes,
    nutritionalFocus: source.nutritionalFocus,
    fitnessGoals: source.fitnessGoals,
    anamnesis: clinicalRecord?.nutritionalAnamnesis,
  }) as Record<string, unknown> | undefined;

  return compactValue({
    schemaVersion: 'patient-ai-context-v1',
    generatedAt: new Date().toISOString(),
    demographics: {
      ageYears,
      sex: trimText(source.gender, 40),
      activityLevel: trimText(source.activityLevel, 40),
      isPediatric: ageYears !== undefined ? ageYears < 18 : undefined,
      isPregnant,
    },
    anthropometry: {
      weightKg: toPositiveNumber(source.weight),
      heightCm: toPositiveNumber(source.height),
      bmi,
      bmiClassification: classifyBmi(bmi),
    },
    goals: {
      nutritionalFocus: source.nutritionalFocus,
      fitnessGoals: source.fitnessGoals,
      primaryCondition: source.primaryCondition,
    },
    clinical: clinicalSection,
    nutrition: nutritionSection,
    calculatedNutrition: automaticNutrition,
    recentConsultations: summarizeConsultations(source.consultations),
    riskFlags,
    missingCriticalData: criticalMissing,
  }) as PatientAiContext;
}
