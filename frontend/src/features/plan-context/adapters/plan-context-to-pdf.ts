import type { FastDeliverablePdfData, FastDeliverableParagraphItem } from "@/features/pdf/FastDeliverablePdfDocument";
import { normalizeFastDeliverableMeals } from "@/features/pdf/fastDeliverableMeals";
import type { PlanContext } from "../types/plan-context.types";

type PdfPlanExtras = {
  patientName?: string | null;
  patientAgeYears?: number | null;
  nutritionistName?: string | null;
  nutritionistEmail?: string | null;
  paragraphs?: FastDeliverableParagraphItem[];
  supplementNote?: string;
  generatedAt?: string;
};

export const planContextToFastDeliverablePdf = (
  context: PlanContext,
  extras: PdfPlanExtras = {},
): FastDeliverablePdfData => ({
  name: context.creation.title || "Entregable rápido",
  patientName: extras.patientName || null,
  patient: context.patient.source === "general"
    ? null
    : {
        name: extras.patientName || null,
        ageYears: extras.patientAgeYears ?? context.patient.demographics.ageYears ?? null,
        weight: context.patient.biometrics.weightKg ?? null,
        height: context.patient.biometrics.heightCm ?? null,
      },
  clinicalRestriction: context.plan.clinicalRestriction || null,
  contentMode: context.plan.format.contentMode,
  tableMode: context.plan.format.tableMode,
  paragraphs: extras.paragraphs || [],
  nutritionistName: extras.nutritionistName || null,
  nutritionistEmail: extras.nutritionistEmail || null,
  planObjective: context.plan.objective,
  showPlanObjectiveInPdf: context.plan.showObjectiveInPdf,
  meals: context.plan.visibility.meals
    ? normalizeFastDeliverableMeals(
        context.plan.meals,
        context.plan.format.tableMode,
        context.plan.format.planMode,
      )
    : [],
  avoidFoods: context.plan.visibility.avoidFoods ? context.plan.avoidFoods : [],
  resources: context.plan.visibility.resources
    ? context.plan.resources
    : [],
  portionGuide: context.plan.visibility.portionGuide
    ? context.plan.portionGuide
    : [],
  supplementNote: extras.supplementNote,
  generatedAt: extras.generatedAt || new Date().toLocaleDateString("es-CL"),
});
