import type { PlanContext } from "../types/plan-context.types";

export type QuickPlanAiTask = {
  notes?: string;
  allowedFoodsMain?: string[];
  allowExternalFoods?: boolean;
  patientId?: string;
  mealSectionTargets?: Array<{
    mealSection: string;
    count: number;
    slotId?: string;
    optionIndexes?: number[];
  }>;
};

export const buildPautaAiPayload = (
  context: PlanContext,
  categories: string[],
  allowedFoods: string[],
  restrictedFoods: string[],
  allowExternalFoods: boolean,
) => ({
  restriction:
    context.plan.clinicalRestriction ||
    context.patient.clinical.restrictions[0] ||
    context.patient.clinical.conditions[0] ||
    "General",
  categories,
  allowedFoods,
  restrictedFoods,
  allowExternalFoods,
  patient: {
    gender: context.patient.demographics.sex,
    ageYears: context.patient.demographics.ageYears,
    weight: context.patient.biometrics.weightKg,
    height: context.patient.biometrics.heightCm,
    clinicalSummary: context.patient.clinical.clinicalSummary,
    likes: context.patient.preferences.likes.join(", "),
    dislikedFoods: context.patient.preferences.dislikedFoods,
    restrictions: context.patient.clinical.restrictions,
    allergies: context.patient.clinical.allergies,
    medications: context.patient.clinical.medications,
    habits: context.patient.lifestyle.habits,
    primaryCondition: context.patient.clinical.conditions[0],
    nutritionalFocus: context.patient.goals.primary,
    fitnessGoals: context.patient.goals.fitnessGoals.join(", "),
  },
});

export const buildQuickPlanAiPayload = (
  context: PlanContext,
  task: QuickPlanAiTask = {},
) => ({
  payload: {
    dietName: context.creation.title || undefined,
    notes: [
      task.notes?.trim() || "",
      context.plan.objective ? `Objetivo del plan: ${context.plan.objective}.` : "",
      context.plan.clinicalRestriction
        ? `Restricción clínica: ${context.plan.clinicalRestriction}.`
        : "",
    ].filter(Boolean).join("\n"),
    specialConsiderations: context.plan.objective || undefined,
    allowedFoodsMain: task.allowedFoodsMain || [],
    allowExternalFoods: task.allowExternalFoods ?? true,
    ...(task.patientId ? { patientId: task.patientId } : {}),
    mealSectionTargets: task.mealSectionTargets,
    generationMode:
      context.plan.format.tableMode === "options"
        ? "options"
        : context.plan.format.planMode,
    patient: {
      gender: context.patient.demographics.sex || "",
      ageYears: context.patient.demographics.ageYears,
      weight: context.patient.biometrics.weightKg,
      height: context.patient.biometrics.heightCm,
      activityLevel: context.patient.lifestyle.activityLevel || "",
      restrictions: [
        ...context.patient.clinical.restrictions,
        ...context.patient.clinical.conditions,
      ],
      allergies: context.patient.clinical.allergies,
      medications: context.patient.clinical.medications,
      habits: context.patient.lifestyle.habits,
      likes: context.patient.preferences.likes.join(", "),
      dislikedFoods: context.patient.preferences.dislikedFoods,
      fitnessGoals: context.patient.goals.fitnessGoals.join(", "),
      clinicalSummary: context.patient.clinical.clinicalSummary || "",
    },
    existingDishes: context.plan.meals.flatMap((meal) => {
      if (context.plan.format.tableMode === "options") {
        return (meal.optionTexts || [])
          .slice(0, context.plan.format.optionCount)
          .filter(Boolean)
          .map((title) => ({ title, mealSection: meal.section }));
      }
      if (context.plan.format.planMode === "single") {
        return meal.mealText?.trim()
          ? [{ title: meal.mealText.trim(), mealSection: meal.section }]
          : [];
      }
      return Object.values(meal.weeklyMealTexts || {})
        .map((title) => title.trim())
        .filter(Boolean)
        .map((title) => ({ title, mealSection: meal.section }));
    }),
  },
});
