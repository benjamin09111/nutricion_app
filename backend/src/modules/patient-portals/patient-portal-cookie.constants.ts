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

const resolveSameSite = (): 'strict' | 'lax' | 'none' => {
  const envVal = process.env.COOKIE_SAME_SITE?.toLowerCase();
  if (envVal === 'strict') return 'strict';
  if (envVal === 'lax') return 'lax';
  if (envVal === 'none') return 'none';
  return isRemote ? 'none' : 'lax';
};

const SAME_SITE: 'strict' | 'lax' | 'none' = resolveSameSite();
const isSecure =
  process.env.NODE_ENV === 'production' ||
  process.env.NODE_ENV === 'prod' ||
  isRemote ||
  process.env.COOKIE_SECURE === 'true';

export const PATIENT_PORTAL_SESSION_COOKIE = 'nutrinet_portal_session';

export const LEGACY_PATIENT_PORTAL_SESSION_COOKIE = 'portal_token_http';

export const patientPortalSessionCookieOptions = (maxAge?: number) => ({
  httpOnly: true as const,
  secure: isSecure,
  sameSite: SAME_SITE,
  path: '/',
  ...(maxAge ? { maxAge } : {}),
});
