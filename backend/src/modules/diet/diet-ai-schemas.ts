import { z } from 'zod';

export const dietConflictSchema = z.object({
  foodName: z.string().trim().min(1),
  restriction: z.string().trim().min(1),
  reason: z.string().trim().min(1),
  severity: z.enum(['low', 'medium', 'high']),
});

export const dietVerifyResponseSchema = z.object({
  conflicts: z.array(dietConflictSchema),
});

export const dietBaseCategoryFoodsSchema = z.object({
  category: z.string().trim().min(1),
  suggestedFoods: z.array(z.string().trim().min(1)),
});

export const dietGenerateBaseResponseSchema = z.object({
  dietTitle: z.string().optional(),
  summary: z.string().optional(),
  categories: z.array(dietBaseCategoryFoodsSchema),
});
