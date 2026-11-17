import { planContextSchema } from "../schemas/plan-context.schema";
import { buildQuickPlanContext } from "../builders/build-quick-plan-context";
import type { PlanContext } from "../types/plan-context.types";

type LegacyCreation = {
  name?: string;
  type?: string;
  content?: Record<string, any>;
  metadata?: Record<string, any>;
};

const asText = (value: unknown) => (typeof value === "string" ? value : "");

export const creationToPlanContext = (creation: LegacyCreation): PlanContext => {
  const content = creation.content || {};
  const storedContext = content.planContext;
  if (storedContext) {
    const parsed = planContextSchema.safeParse(storedContext);
    if (parsed.success) return parsed.data as PlanContext;
  }

  const resources = Array.isArray(content.resources)
    ? content.resources
    : content.resource?.title
      ? [{ resourceId: "legacy-resource", title: content.resource.title, content: content.resource.content || "", variables: {} }]
      : [];

  return buildQuickPlanContext({
    title: asText(content.title) || asText(creation.name) || "Entregable rápido",
    description: asText(creation.metadata?.description) || asText(content.quickDescription),
    tags: Array.isArray(content.quickHashtags)
      ? content.quickHashtags
      : asText(content.quickHashtags).split(","),
    planObjective: asText(content.planObjective),
    showPlanObjectiveInPdf: content.showPlanObjectiveInPdf === true,
    selectedRestriction: asText(content.clinicalRestriction || content.selectedRestriction || content.restriction),
    hasClinicalRestriction: content.hasClinicalRestriction === true,
    planMode: content.planMode === "weekly" ? "weekly" : "single",
    tableMode: content.tableMode === "options" ? "options" : "simple",
    optionCount: Math.max(1, Math.min(3, Number(content.optionCount) || 1)),
    contentMode: content.contentMode === "both"
      ? "both"
      : content.contentMode === "paragraphs" || creation.type === "PAUTAS"
        ? "paragraphs"
        : "table",
    paragraphs: Array.isArray(content.paragraphs) ? content.paragraphs : [],
    meals: Array.isArray(content.meals) ? content.meals : [],
    avoidFoods: Array.isArray(content.avoidFoods)
      ? content.avoidFoods.map((food: any) => typeof food === "string" ? food : food?.value || "")
      : asText(content.avoidFoods).split(","),
    portionGuideRows: Array.isArray(content.portionGuideRows)
      ? content.portionGuideRows
      : Array.isArray(content.portionGuide) ? content.portionGuide : [],
    resources,
    includeMeals: content.includeMeals !== false,
    includeAvoidFoods: content.includeAvoidFoods !== false,
    includeResources: content.includeResources !== false,
    includePortionGuide: content.includePortionGuide !== false,
    patient: {
      id: asText(creation.metadata?.patientId) || undefined,
      ...(creation.metadata?.patientId ? { source: "imported" as const } : {}),
      ageYears: content.patient?.ageYears ?? null,
      birthDate: content.patient?.birthDate ?? null,
      gender: content.patient?.gender ?? null,
      weight: content.patient?.weight ?? null,
      height: content.patient?.height ?? null,
      nutritionalFocus: content.patient?.nutritionalFocus ?? null,
      fitnessGoals: content.patient?.fitnessGoals ?? null,
      restrictions: content.patient?.restrictions || [],
      allergies: content.patient?.allergies || [],
      medications: content.patient?.medications || [],
      habits: content.patient?.habits || [],
      dislikedFoods: content.patient?.dislikedFoods || [],
      likes: content.patient?.likes ?? null,
      clinicalSummary: content.patient?.clinicalSummary ?? null,
      activityLevel: content.patient?.activityLevel ?? null,
    },
  });
};
