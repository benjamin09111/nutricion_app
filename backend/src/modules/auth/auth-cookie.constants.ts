// ─── Unified httpOnly JWT cookie (never readable by JS) ──────────────────────
// Stores the actual JWT. httpOnly ensures XSS cannot steal it.
export const AUTH_SESSION_COOKIE = 'auth_session';

// ─── Non-httpOnly presence indicator cookie ────────────────────────────────────
// Value is always "1". Lets client-side JS / Next.js middleware know a session
// exists WITHOUT ever exposing the JWT itself.
export const AUTH_PRESENCE_COOKIE = 'auth_session_present';

// ─── Legacy names kept for clearCookie calls in logout ───────────────────────
export const LEGACY_AUTH_SESSION_COOKIE = 'auth_token_http';
export const LEGACY_SENTINEL_COOKIE = 'auth_token';
export const LEGACY_NUTRINET_SESSION_COOKIE = 'nutrinet_session';

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

// ─── Cookie option factories ──────────────────────────────────────────────────
// In production/remote environments, frontend and backend are on different domains.
// SameSite=None is REQUIRED for cookies to be sent in cross-origin fetch requests
// with credentials:"include". SameSite=None also mandates Secure=true.
export const authSessionCookieOptions = (maxAge?: number) => ({
  httpOnly: true as const,
  secure: isRemote,
  sameSite: (isRemote ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
  ...(maxAge ? { maxAge } : {}),
});

/** Non-httpOnly presence indicator – value is always "1" */
export const authPresenceCookieOptions = (maxAge?: number) => ({
  httpOnly: false as const,
  secure: isRemote,
  sameSite: (isRemote ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
  ...(maxAge ? { maxAge } : {}),
});

