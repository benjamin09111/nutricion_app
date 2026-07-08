import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(value: string): string {
  if (!value) return "";
  let cleaned = value.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 8) return cleaned;
  const country = digits.length > 10 ? digits.slice(0, 2) : "56";
  const rest = digits.length > 10 ? digits.slice(2) : digits;
  return `+${country} ${rest.slice(0, 1)} ${rest.slice(1, 5)} ${rest.slice(5)}`;
}

export function sanitizePhone(value: string): string {
  if (!value) return "";
  let val = value;
  if (!val.startsWith("+")) val = "+" + val.replace(/\+/g, "");
  return "+" + val.slice(1).replace(/\D/g, "");
}
