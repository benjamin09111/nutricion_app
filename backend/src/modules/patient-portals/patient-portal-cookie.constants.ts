const isRemote =
  process.env.NODE_ENV === 'production' ||
  process.env.NODE_ENV === 'prod' ||
  Boolean(process.env.RAILWAY_PUBLIC_DOMAIN) ||
  Boolean(
    process.env.API_URL &&
    !process.env.API_URL.includes('localhost') &&
    !process.env.API_URL.includes('127.0.0.1'),
  ) ||
  Boolean(
    process.env.FRONTEND_URL &&
    !process.env.FRONTEND_URL.includes('localhost') &&
    !process.env.FRONTEND_URL.includes('127.0.0.1'),
  );

// Anotado como constante nombrada a proposito: dentro del literal el tipo
// se ensancharia a `string` y dejaria de encajar en `CookieOptions`, y una
// asercion en linea la elimina el autofix de no-unnecessary-type-assertion.
const SAME_SITE: 'none' | 'lax' = isRemote ? 'none' : 'lax';

export const PATIENT_PORTAL_SESSION_COOKIE = 'nutrinet_portal_session';

export const LEGACY_PATIENT_PORTAL_SESSION_COOKIE = 'portal_token_http';

export const patientPortalSessionCookieOptions = (maxAge?: number) => ({
  httpOnly: true as const,
  secure: isRemote,
  sameSite: SAME_SITE,
  path: '/',
  ...(maxAge ? { maxAge } : {}),
});
