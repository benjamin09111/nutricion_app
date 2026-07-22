import { z } from 'zod';

const pautaFoodSchema = z
  .object({
    portion: z.string().trim().min(1),
    food: z.string().trim().min(1),
  })
  .strict();

const pautaParagraphSchema = z
  .object({
    category: z.string().trim().min(1),
    categoryOptional: z.string().trim(),
    portionsPerDay: z.string().trim().min(1),
    foods: z.array(pautaFoodSchema).min(1),
  })
  .strict();

export const pautaAiResponseSchema = z
  .object({
    paragraphs: z.array(pautaParagraphSchema).min(1),
  })
  .strict();

export type PautaAiResponse = z.infer<typeof pautaAiResponseSchema>;
