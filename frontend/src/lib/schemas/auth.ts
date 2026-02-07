import { z } from 'zod';

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, { message: 'El correo electrónico es obligatorio' })
        .email({ message: 'Ingresa un correo electrónico válido' }),
    password: z
        .string()
        .min(1, { message: 'La contraseña es obligatoria' }),
    rememberMe: z.boolean(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
    name: z.string().min(1, { message: 'El nombre es obligatorio' }),
    email: z
        .string()
        .min(1, { message: 'El correo electrónico es obligatorio' })
        .email({ message: 'Ingresa un correo electrónico válido' }),
    description: z.string().optional(),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
