export type PlanContextSchemaVersion = "1.0";
export type PatientContextSource = "general" | "manual" | "imported";
export type PlanCreationType = "FAST_DELIVERABLE";
export type PlanMode = "single" | "weekly";
export type PlanTableMode = "simple" | "options";

export interface PatientPlanningContext {
  source: PatientContextSource;
  demographics: {
    sex?: string;
    ageYears?: number;
  };
  biometrics: {
    weightKg?: number;
    heightCm?: number;
  };
  lifestyle: {
    activityLevel?: string;
    habits: string[];
  };
  clinical: {
    conditions: string[];
    restrictions: string[];
    allergies: string[];
    medications: string[];
    clinicalSummary?: string;
  };
  preferences: {
    likes: string[];
    dislikedFoods: string[];
  };
  goals: {
    primary?: string;
    fitnessGoals: string[];
  };
}

export interface PlanMeal {
  section: string;
  time?: string;
  portion?: string;
  mealText?: string;
  weeklyMealTexts?: Record<string, string>;
  optionTexts?: string[];
}

export interface PlanParagraph {
  category: string;
  categoryOptional?: string;
  portionsPerDay?: string;
  foods: Array<{ portion: string; food: string }>;
}

export interface PlanResource {
  resourceId: string;
  title: string;
  content: string;
  variables: Record<string, string>;
}

export interface PlanContext {
  schemaVersion: PlanContextSchemaVersion;
  creation: {
    type: PlanCreationType;
    mode: "GENERAL" | "CLINICAL";
    title: string;
    description?: string;
    tags: string[];
  };
  patient: PatientPlanningContext;
  plan: {
    objective?: string;
    showObjectiveInPdf: boolean;
    clinicalRestriction?: string;
    format: {
      planMode: PlanMode;
      tableMode: PlanTableMode;
      optionCount: number;
      contentMode: "table" | "paragraphs" | "both";
    };
    paragraphs: PlanParagraph[];
    meals: PlanMeal[];
    avoidFoods: string[];
    avoidFoodCategories: Array<{ name: string; category?: string }>;
    portionGuide: Array<{ category: string; portion: string }>;
    resources: PlanResource[];
    visibility: {
      meals: boolean;
      avoidFoods: boolean;
      resources: boolean;
      portionGuide: boolean;
    };
  };
  metadata: {
    updatedAt: string;
  };
}
