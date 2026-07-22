export interface CalculationResult {
  version: string;
  calculatedAt: string;
  inputs: {
    gender: string;
    age: number | null;
    weight: number | null;
    dryWeight?: number | null;
    edemaPercent?: number;
    height: number | null;
    targetBmi?: number;
    activityLevel: string;
    kneeHeight: number | null;
    calfCircumference: number | null;
    armCircumference: number | null;
    waistCircumference: number | null;
    hipCircumference: number | null;
    usualWeight?: number | null;
    weightLossPeriodWeeks?: number | null;
    proteinProfile?: string;
    useUsualWeightForRequirements?: boolean;
    folds: {
      tricipital: number | null;
      subescapular: number | null;
      bicipital: number | null;
      suprailiaco: number | null;
    };
  };
  estimatedHeight: number | null;
  estimatedWeight: number | null;
  dryWeight?: number | null;
  edemaPercent?: number;
  bmi: {
    bmi: number;
    classification: string;
    color: string;
    isPediatric: boolean;
    percentile?: number;
    percentileCategory?: string;
    reference?: string;
    note?: string;
  } | null;
  idealWeight: {
    min: number;
    max: number;
    reference: string;
    note?: string;
    supported: boolean;
  } | null;
  adjustedWeight: number | null;
  weightLoss?: {
    usualWeight: number;
    currentWeight: number;
    periodWeeks: number;
    periodLabel: string;
    lossKg: number;
    percentLoss: number;
    severity: 'normal' | 'significativa' | 'grave';
    isAlert: boolean;
  } | null;
  armComposition: {
    cmbMm: number;
    atbMm2: number;
    ambMm2: number;
    agbMm2: number;
    fatPercentage: number;
  } | null;
  cardiovascularRisk: {
    waistCircumference: number;
    hipCircumference: number | null;
    icc: number | null;
    iccRisk: string;
    waistRiskNcep: string;
    waistRiskIdf: string;
  } | null;
  energy: {
    tmb: number;
    formula: string;
    get: number;
    activityFactor: number;
    macros: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      proteinPercent: number;
      carbsPercent: number;
      fatsPercent: number;
    };
  } | null;
  proteinRequirement?: {
    profileKey: string;
    profileLabel: string;
    minPerKg: number;
    maxPerKg: number;
    minGrams: number;
    maxGrams: number;
    minPercentGet: number;
    maxPercentGet: number;
  } | null;
  hydration?: {
    method: string;
    minMl: number;
    maxMl: number;
    minL: number;
    maxL: number;
    note: string;
  } | null;
  exchangePortions: {
    category: string;
    amount: string;
    portions: number;
    cho: number;
    protein: number;
    fat: number;
    kcal: number;
    profileId: string;
  }[];
}

export interface MNAData {
  score: number;
  category: string;
  color: string;
  isAlert: boolean;
}
