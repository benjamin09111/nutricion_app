import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "@/lib/password-policy";

export const securePasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, {
    message: `Usa al menos ${PASSWORD_MIN_LENGTH} caracteres`,
  })
  .regex(/[A-Z]/, { message: "Incluye al menos una mayúscula" })
  .regex(/[a-z]/, { message: "Incluye al menos una minúscula" })
  .regex(/\d/, { message: "Incluye al menos un número" })
  .regex(/[^A-Za-z0-9]/, { message: "Incluye al menos un carácter especial" })
  .regex(/^\S+$/, { message: "No uses espacios en la contraseña" })
  .refine((value) => new TextEncoder().encode(value).length <= 72, {
    message: "La contraseña es demasiado larga",
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "El correo electrónico es obligatorio" })
    .email({ message: "Ingresa un correo electrónico válido" }),
  password: z.string().min(1, { message: "La contraseña es obligatoria" }),
  rememberMe: z.boolean(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

const fullNameSchema = z
  .string()
  .trim()
  .min(1, { message: "Ingresa tu nombre completo" })
  .max(120, { message: "El nombre es demasiado largo" })
  .refine((value) => value.split(/\s+/).filter(Boolean).length >= 3, {
    message: "Ingresa nombre y dos apellidos",
  })
  .transform((value) => value.replace(/\s+/g, " "));

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: z
      .string()
      .trim()
      .min(1, { message: "El correo electrónico es obligatorio" })
      .email({ message: "Ingresa un correo electrónico válido" }),
    password: securePasswordSchema,
    confirmPassword: z.string().min(1, { message: "Confirma tu contraseña" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

