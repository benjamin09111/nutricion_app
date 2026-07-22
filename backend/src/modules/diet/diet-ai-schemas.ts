import { z } from 'zod';

export const dietConflictSchema = z
  .object({
    foodName: z.string().trim().min(1),
    restriction: z.string().trim().min(1),
    reason: z.string().trim().min(1),
    severity: z.enum(['low', 'medium', 'high']),
  })
  .strict();

export const dietVerifyResponseSchema = z
  .object({
    conflicts: z.array(dietConflictSchema),
  })
  .strict();
