const ALLOWED_POST_AUTH_PATHS = [
  "/dashboard",
  "/plan",
  "/onboarding/rut",
] as const;

export function resolveSafePostAuthPath(
  value: string | null | undefined,
  fallback = "/dashboard",
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  if (value.includes("\\") || /[\u0000-\u001F\u007F]/.test(value)) {
    return fallback;
  }

  try {
    const base = new URL("https://nutrinet.local");
    const parsed = new URL(value, base);
    const isAllowedPath = ALLOWED_POST_AUTH_PATHS.some(
      (prefix) =>
        parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`),
    );

    return parsed.origin === base.origin && isAllowedPath
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
