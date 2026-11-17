import { z } from "zod";

const optionalText = z.string().trim().min(1).optional();

export const patientPlanningContextSchema = z.object({
  source: z.enum(["general", "manual", "imported"]),
  demographics: z.object({ sex: optionalText, ageYears: z.number().nonnegative().optional() }),
  biometrics: z.object({ weightKg: z.number().nonnegative().optional(), heightCm: z.number().nonnegative().optional() }),
  lifestyle: z.object({ activityLevel: optionalText, habits: z.array(z.string()) }),
  clinical: z.object({
    conditions: z.array(z.string()),
    restrictions: z.array(z.string()),
    allergies: z.array(z.string()),
    medications: z.array(z.string()),
    clinicalSummary: optionalText,
  }),
  preferences: z.object({ likes: z.array(z.string()), dislikedFoods: z.array(z.string()) }),
  goals: z.object({ primary: optionalText, fitnessGoals: z.array(z.string()) }),
});

export const planContextSchema = z.object({
  schemaVersion: z.literal("1.0"),
  creation: z.object({
    type: z.literal("FAST_DELIVERABLE"),
    mode: z.enum(["GENERAL", "CLINICAL"]),
    title: z.string(),
    description: optionalText,
    tags: z.array(z.string()),
  }),
  patient: patientPlanningContextSchema,
  plan: z.object({
    objective: optionalText,
    showObjectiveInPdf: z.boolean(),
    clinicalRestriction: optionalText,
    format: z.object({
      planMode: z.enum(["single", "weekly"]),
      tableMode: z.enum(["simple", "options"]),
      optionCount: z.number().int().min(1).max(3),
      contentMode: z.enum(["table", "paragraphs", "both"]),
    }),
    paragraphs: z.array(z.object({
      category: z.string(),
      categoryOptional: z.string().optional(),
      portionsPerDay: z.string().optional(),
      foods: z.array(z.object({ portion: z.string(), food: z.string() })),
    })),
    meals: z.array(z.object({
      section: z.string(),
      time: z.string().optional(),
      portion: z.string().optional(),
      mealText: z.string().optional(),
      weeklyMealTexts: z.record(z.string(), z.string()).optional(),
      optionTexts: z.array(z.string()).optional(),
    })),
    avoidFoods: z.array(z.string()),
    portionGuide: z.array(z.object({ category: z.string(), portion: z.string() })),
    resources: z.array(z.object({ resourceId: z.string(), title: z.string(), content: z.string(), variables: z.record(z.string(), z.string()) })),
    visibility: z.object({ meals: z.boolean(), avoidFoods: z.boolean(), resources: z.boolean(), portionGuide: z.boolean() }),
  }),
  metadata: z.object({ updatedAt: z.string() }),
});

export type PlanContextInput = z.input<typeof planContextSchema>;
