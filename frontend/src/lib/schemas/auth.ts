import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "@/lib/password-policy";

export const securePasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, {
    message: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
  })
  .regex(/[A-Z]/, {
    message: "La contraseña debe incluir al menos una letra mayúscula",
  })
  .regex(/[a-z]/, {
    message: "La contraseña debe incluir al menos una letra minúscula",
  })
  .regex(/\d/, {
    message: "La contraseña debe incluir al menos un número",
  })
  .regex(/[^A-Za-z0-9]/, {
    message: "La contraseña debe incluir al menos un carácter especial",
  })
  .regex(/^\S+$/, {
    message: "La contraseña no debe contener espacios",
  });

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El correo electrónico es obligatorio" })
    .email({ message: "Ingresa un correo electrónico válido" }),
  password: z.string().min(1, { message: "La contraseña es obligatoria" }),
  rememberMe: z.boolean(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(1, { message: "El nombre es obligatorio" }),
  email: z
    .string()
    .min(1, { message: "El correo electrónico es obligatorio" })
    .email({ message: "Ingresa un correo electrónico válido" }),
  description: z.string().optional(),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const landingRegistrationSchema = z.object({
  fullName: z.string().min(1, { message: "El nombre completo es obligatorio" }),
  email: z
    .string()
    .min(1, { message: "El correo electrónico es obligatorio" })
    .email({ message: "Ingresa un correo electrónico válido" }),
  password: securePasswordSchema,
  message: z.string().optional(),
});

export type LandingRegistrationFormData = z.infer<
  typeof landingRegistrationSchema
>;
