const ALLOWED_POST_AUTH_PATHS = [
  '/dashboard',
  '/plan',
  '/onboarding/rut',
] as const;

export const resolveSafePostAuthPath = (
  value: string | null | undefined,
  fallback = '/dashboard',
) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  // eslint-disable-next-line no-control-regex -- rechazar caracteres de control es justamente el objetivo
  if (value.includes('\\') || /[\u0000-\u001F\u007F]/.test(value)) {
    return fallback;
  }

  try {
    const base = new URL('https://nutrinet.local');
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
};

/**
 * Sanitiza un path de retorno arbitrario (por ejemplo el de una pasarela de
 * pago) antes de concatenarlo al origen del frontend. A diferencia de
 * `resolveSafePostAuthPath` no aplica una lista blanca de rutas: sólo garantiza
 * que el valor sea un path relativo al propio sitio y no un destino externo.
 */
export const resolveSafeRelativePath = (
  value: string | null | undefined,
  fallback = '/',
) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  // eslint-disable-next-line no-control-regex -- rechazar caracteres de control es justamente el objetivo
  if (value.includes('\\') || /[\u0000-\u001F\u007F]/.test(value)) {
    return fallback;
  }

  try {
    const base = new URL('https://nutrinet.local');
    const parsed = new URL(value, base);

    return parsed.origin === base.origin
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : fallback;
  } catch {
    return fallback;
  }
};
