import type { PlanContext, PatientPlanningContext } from "../types/plan-context.types";
import { planContextSchema } from "../schemas/plan-context.schema";

type PatientInput = {
  id?: string;
  ageYears?: number | null;
  birthDate?: string | null;
  gender?: string | null;
  weight?: number | null;
  height?: number | null;
  nutritionalFocus?: string | null;
  fitnessGoals?: string | null;
  restrictions?: string[];
  dietRestrictions?: string[];
  allergies?: string[];
  medications?: string[];
  habits?: string[];
  primaryCondition?: string | null;
  dislikedFoods?: string[];
  likes?: string | null;
  clinicalSummary?: string | null;
  activityLevel?: string | null;
  source?: "manual" | "imported";
};

type ResourceInput = {
  resourceId: string;
  title: string;
  content: string;
  variables: Record<string, string>;
};

type QuickPlanInput = {
  title: string;
  description?: string;
  tags?: string[];
  planObjective?: string;
  showPlanObjectiveInPdf: boolean;
  selectedRestriction?: string;
  hasClinicalRestriction?: boolean;
  planMode: "single" | "weekly";
  tableMode: "simple" | "options";
  optionCount: number;
  contentMode: "table" | "paragraphs" | "both";
  paragraphs: Array<{ category: string; categoryOptional: string; portionsPerDay: string; foods: Array<{ portion: string; food: string }> }>;
  meals: Array<{ section: string; time?: string; portion?: string; mealText: string; weeklyMealTexts?: Record<string, string>; optionTexts?: string[] }>;
  avoidFoods: string[];
  portionGuideRows: Array<{ category: string; portion: string }>;
  resources: ResourceInput[];
  includeMeals: boolean;
  includeAvoidFoods: boolean;
  includeResources: boolean;
  includePortionGuide: boolean;
  patient: PatientInput;
};

const compactList = (values?: string[]) => Array.from(new Set((values || []).map((value) => value.trim()).filter(Boolean)));

const resolveAge = (patient: PatientInput): number | undefined => {
  if (typeof patient.ageYears === "number" && patient.ageYears >= 0) return patient.ageYears;
  if (!patient.birthDate) return undefined;
  const birthDate = new Date(patient.birthDate);
  if (Number.isNaN(birthDate.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday = today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : undefined;
};

export const buildPatientPlanningContext = (patient: PatientInput): PatientPlanningContext => {
  const restrictions = compactList([...(patient.restrictions || []), ...(patient.dietRestrictions || [])]);
  const conditions = compactList([patient.primaryCondition || ""]);
  const likes = compactList((patient.likes || "").split(/[,\n]+/));
  const fitnessGoals = compactList((patient.fitnessGoals || "").split(/[,\n]+/));
  const hasPlanningData = Boolean(
    patient.id ||
      patient.ageYears ||
      patient.birthDate ||
      patient.gender?.trim() ||
      patient.weight ||
      patient.height ||
      patient.nutritionalFocus?.trim() ||
      patient.fitnessGoals?.trim() ||
      restrictions.length ||
      patient.dislikedFoods?.length ||
      patient.allergies?.length ||
      patient.medications?.length ||
      patient.habits?.length ||
      patient.likes?.trim() ||
      patient.clinicalSummary?.trim() ||
      patient.activityLevel,
  );
  const source = hasPlanningData
    ? patient.source || (patient.id ? "imported" : "manual")
    : "general";

  return {
    source,
    demographics: {
      ...(patient.gender?.trim() ? { sex: patient.gender.trim() } : {}),
      ...(resolveAge(patient) !== undefined ? { ageYears: resolveAge(patient) } : {}),
    },
    biometrics: {
      ...(typeof patient.weight === "number" && patient.weight > 0 ? { weightKg: patient.weight } : {}),
      ...(typeof patient.height === "number" && patient.height > 0 ? { heightCm: patient.height } : {}),
    },
    lifestyle: {
      ...(patient.activityLevel?.trim() ? { activityLevel: patient.activityLevel.trim() } : {}),
      habits: compactList(patient.habits),
    },
    clinical: {
      conditions,
      restrictions,
      allergies: compactList(patient.allergies),
      medications: compactList(patient.medications),
      ...(patient.clinicalSummary?.trim() ? { clinicalSummary: patient.clinicalSummary.trim() } : {}),
    },
    preferences: {
      likes,
      dislikedFoods: compactList(patient.dislikedFoods),
    },
    goals: {
      ...(patient.nutritionalFocus?.trim() ? { primary: patient.nutritionalFocus.trim() } : {}),
      fitnessGoals,
    },
  };
};

export const buildQuickPlanContext = (input: QuickPlanInput): PlanContext => {
  const patient = buildPatientPlanningContext(input.patient);
  const context = {
    schemaVersion: "1.0" as const,
    creation: {
      type: "FAST_DELIVERABLE" as const,
      mode: patient.source === "general" ? "GENERAL" as const : "CLINICAL" as const,
      title: input.title.trim(),
      ...(input.description?.trim() ? { description: input.description.trim() } : {}),
      tags: compactList(input.tags),
    },
    patient,
    plan: {
    ...(input.planObjective?.trim() ? { objective: input.planObjective.trim() } : {}),
    showObjectiveInPdf: input.showPlanObjectiveInPdf,
    ...(input.hasClinicalRestriction && input.selectedRestriction?.trim()
      ? { clinicalRestriction: input.selectedRestriction.trim() }
      : {}),
    format: {
      planMode: input.planMode,
      tableMode: input.tableMode,
      optionCount: Math.max(1, Math.min(3, input.optionCount)),
      contentMode: input.contentMode,
    },
    paragraphs: input.paragraphs.map((paragraph) => ({
      category: paragraph.category.trim(),
      ...(paragraph.categoryOptional.trim() ? { categoryOptional: paragraph.categoryOptional.trim() } : {}),
      ...(paragraph.portionsPerDay.trim() ? { portionsPerDay: paragraph.portionsPerDay.trim() } : {}),
      foods: paragraph.foods
        .map((food) => ({ portion: food.portion.trim(), food: food.food.trim() }))
        .filter((food) => food.portion || food.food),
    })).filter((paragraph) => paragraph.category || paragraph.foods.length > 0),
    meals: input.meals.map((meal) => ({
      section: meal.section.trim(),
      ...(meal.time?.trim() ? { time: meal.time.trim() } : {}),
      ...(meal.portion?.trim() ? { portion: meal.portion.trim() } : {}),
      ...(meal.mealText.trim() ? { mealText: meal.mealText.trim() } : {}),
      ...(meal.weeklyMealTexts ? { weeklyMealTexts: meal.weeklyMealTexts } : {}),
      ...(meal.optionTexts ? { optionTexts: meal.optionTexts.map((option) => option.trim()).filter(Boolean) } : {}),
    })).filter((meal) => meal.section || meal.mealText || Object.values(meal.weeklyMealTexts || {}).some(Boolean) || (meal.optionTexts || []).length > 0),
    avoidFoods: compactList(input.avoidFoods),
    portionGuide: input.portionGuideRows
      .map((row) => ({ category: row.category.trim(), portion: row.portion.trim() }))
      .filter((row) => row.category || row.portion),
    resources: input.resources
      .map((resource) => ({
        resourceId: resource.resourceId,
        title: resource.title.trim(),
        content: resource.content.trim(),
        variables: resource.variables,
      }))
      .filter((resource) => resource.resourceId && resource.title),
      visibility: {
        meals: input.includeMeals,
        avoidFoods: input.includeAvoidFoods,
        resources: input.includeResources,
        portionGuide: input.includePortionGuide,
      },
    },
    metadata: { updatedAt: new Date().toISOString() },
  };

  return planContextSchema.parse(context) as PlanContext;
};
