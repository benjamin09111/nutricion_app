import { z } from 'zod';

export const aiIngredientSchema = z
  .object({
    name: z.string().trim().min(1),
    quantity: z.string().trim().optional().default(''),
    amount: z.number().optional(),
    unit: z.string().trim().optional(),
    optional: z.boolean().default(false),
  })
  .strict();

export const aiRecipeSchema = z
  .object({
    slotId: z.string().trim().min(1),
    mealSection: z.string().trim().min(1),
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    preparation: z.string().trim().min(1),
    recommendedPortion: z.string().trim().min(1),
    complexity: z.enum(['simple', 'elaborada']),
    protein: z.number().finite(),
    calories: z.number().finite(),
    carbs: z.number().finite(),
    fats: z.number().finite(),
    ingredients: z.array(aiIngredientSchema),
    mainIngredients: z.array(z.string().trim().min(1)),
    extraIngredients: z.array(z.string().trim().min(1)).default([]),
  })
  .strict();

export const aiReplacementGuideSchema = z
  .object({
    mealSection: z.string().trim().min(1),
    suggestions: z.array(z.string().trim().min(1)),
  })
  .strict();

export const aiFillMetaSchema = z
  .object({
    note: z.string().trim().min(1),
    replacementGuide: z.array(aiReplacementGuideSchema),
  })
  .strict();

export const aiFillDayResponseSchema = z
  .object({
    recipes: z.array(aiRecipeSchema),
    meta: aiFillMetaSchema,
  })
  .strict();

export const aiFillWeekResponseSchema = z
  .object({
    days: z
      .array(
        z
          .object({
            day: z.string().trim().min(1),
            recipes: z.array(aiRecipeSchema),
          })
          .strict(),
      )
      .min(1),
    meta: aiFillMetaSchema,
  })
  .strict();

export const quickAiDishSchema = z
  .object({
    title: z.string().trim().min(1),
    mealSection: z.string().trim().min(1),
    description: z.string().trim().min(1),
    preparation: z.string().trim().min(1),
    recommendedPortion: z.string().trim().min(1),
    portions: z.number().int().min(1),
    protein: z.number().finite(),
    calories: z.number().finite(),
    carbs: z.number().finite(),
    fats: z.number().finite(),
    ingredients: z.array(aiIngredientSchema),
  })
  .strict();

export const quickAiFillResponseSchema = z
  .object({
    dishes: z.array(quickAiDishSchema).min(1),
    meta: z
      .object({
        note: z.string().trim().min(1),
      })
      .strict(),
  })
  .strict();
