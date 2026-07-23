export const PATIENT_PORTAL_SESSION_COOKIE =
  process.env.NODE_ENV === 'production'
    ? 'nutrinet_portal_session'
    : 'portal_token_http';

export const LEGACY_PATIENT_PORTAL_SESSION_COOKIE = 'portal_token_http';

export const patientPortalSessionCookieOptions = (maxAge?: number) => ({
  httpOnly: true as const,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  ...(maxAge ? { maxAge } : {}),
});
