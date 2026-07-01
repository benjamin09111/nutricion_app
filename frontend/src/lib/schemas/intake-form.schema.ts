import { z } from 'zod';

export const intakeFormSchema = z.object({
  fullName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z
    .string()
    .email('El correo electrónico no es válido')
    .max(255)
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .max(20)
    .optional()
    .or(z.literal('')),
  documentId: z
    .string()
    .max(20)
    .optional()
    .or(z.literal('')),
  birthDate: z
    .string()
    .optional()
    .or(z.literal('')),
  gender: z
    .enum(['Masculino', 'Femenino', 'Otro'])
    .optional(),
  height: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((v) => {
      if (!v || v.trim() === '') return undefined;
      const n = Number(v);
      return isNaN(n) ? undefined : n;
    }),
  weight: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((v) => {
      if (!v || v.trim() === '') return undefined;
      const n = Number(v);
      return isNaN(n) ? undefined : n;
    }),
  activityLevel: z
    .enum(['sedentario', 'ligero', 'moderado', 'activo', 'muy_activo'])
    .optional(),
  nutritionalFocus: z
    .string()
    .max(50)
    .optional()
    .or(z.literal('')),
  fitnessGoals: z
    .string()
    .max(50)
    .optional()
    .or(z.literal('')),
  dietRestrictions: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((value) =>
      value
        ? value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
    ),
  likes: z
    .string()
    .max(500)
    .optional()
    .or(z.literal('')),
  honeypot: z.string().optional(),
});

export type IntakeFormData = z.infer<typeof intakeFormSchema>;
