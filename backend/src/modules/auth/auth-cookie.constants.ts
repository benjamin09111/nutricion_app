export const AUTH_SESSION_COOKIE =
  process.env.NODE_ENV === 'production'
    ? '__Host-nutrinet_session'
    : 'auth_token_http';

export const LEGACY_AUTH_SESSION_COOKIE = 'auth_token_http';

export const authSessionCookieOptions = (maxAge?: number) => ({
  httpOnly: true as const,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  ...(maxAge ? { maxAge } : {}),
});
