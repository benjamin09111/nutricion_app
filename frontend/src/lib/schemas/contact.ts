import { z } from "zod";

export const landingContactSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El correo electrónico es obligatorio" })
    .email({ message: "Ingresa un correo electrónico válido" }),
  message: z.string().min(1, { message: "Escribe tu mensaje" }),
});

export type LandingContactFormData = z.infer<typeof landingContactSchema>;
