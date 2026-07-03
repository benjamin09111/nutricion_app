import { z } from "zod";
import latinAmericaCountries from "./data/latin-america-countries.json";

const trimString = (value: unknown) =>
  typeof value === "string" ? value.trim() : value;

export const latinAmericaCountryList = latinAmericaCountries as string[];

export const normalizeOptionalString = (schema: z.ZodTypeAny) =>
  z.preprocess(trimString, z.union([z.literal(""), schema]));

export const normalizeRequiredString = (schema: z.ZodTypeAny) =>
  z.preprocess(trimString, schema);

export function isLatinAmericaCountry(value: string) {
  return latinAmericaCountryList.includes(value.trim());
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidInternationalPhone(value: string) {
  const normalized = value.trim().replace(/[\s().-]/g, "");
  return /^\+[1-9]\d{7,14}$/.test(normalized);
}

export function isValidInstagramHandle(value: string) {
  return /^@[A-Za-z0-9._]{1,30}$/.test(value.trim());
}

export function isValidLinkedInProfile(value: string) {
  const rawValue = value.trim();

  if (!rawValue) {
    return false;
  }

  const candidate = rawValue.startsWith("http://") || rawValue.startsWith("https://")
    ? rawValue
    : `https://${rawValue}`;

  try {
    const url = new URL(candidate);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();

    if (host !== "linkedin.com") {
      return false;
    }

    const path = url.pathname.replace(/\/+$/, "");
    return /^\/(in|pub|company)\/[A-Za-z0-9._%/-]+$/.test(path);
  } catch {
    return false;
  }
}
