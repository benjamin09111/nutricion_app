import { z } from "zod";
import {
  isLatinAmericaCountry,
  isValidEmail,
  isValidInstagramHandle,
  isValidInternationalPhone,
  isValidLinkedInProfile,
  normalizeOptionalString,
  normalizeRequiredString,
} from "../validators";

export const profileSettingsSchema = z.object({
  publicProfileEnabled: z.boolean(),
  publicSlug: normalizeOptionalString(
    z.string().refine((value) => value === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), {
      message: "Usa minúsculas, números y guiones",
    }),
  ),
  headline: normalizeOptionalString(z.string().max(100, "Máximo 100 caracteres")),
  country: normalizeRequiredString(
    z.string().refine(isLatinAmericaCountry, {
      message: "Selecciona un país de Latinoamérica",
    }),
  ),
  publicPhone: normalizeOptionalString(
    z.string().refine((value) => value === "" || isValidInternationalPhone(value), {
      message: "Usa formato internacional, por ejemplo +56912345678",
    }),
  ),
  publicEmail: normalizeOptionalString(
    z.string().refine((value) => value === "" || isValidEmail(value), {
      message: "Ingresa un correo electrónico válido",
    }),
  ),
  professionalInstagram: normalizeOptionalString(
    z.string().refine((value) => value === "" || isValidInstagramHandle(value), {
      message: "Usa un usuario válido que comience con @",
    }),
  ),
  linkedin: normalizeOptionalString(
    z.string().refine((value) => value === "" || isValidLinkedInProfile(value), {
      message: "Ingresa un perfil válido de LinkedIn",
    }),
  ),
  bio: normalizeOptionalString(z.string()),
  consultationMode: normalizeRequiredString(
    z.enum(["online", "presencial", "both", "na"]),
  ),
  conditionsTreated: normalizeOptionalString(z.string()),
  patientTypes: normalizeOptionalString(z.string()),
  prices: normalizeOptionalString(z.string()),
  paymentMethods: normalizeOptionalString(z.string()),
  officeAddress: normalizeOptionalString(z.string()),
});

export type ProfileSettingsFormValues = z.infer<typeof profileSettingsSchema>;
