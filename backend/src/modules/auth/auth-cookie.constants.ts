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

// ─── Cookie option factories ──────────────────────────────────────────────────
// In production, frontend and backend are on different Railway domains.
// SameSite=None is REQUIRED for httpOnly cookies to be sent in cross-origin
// fetch requests with credentials:"include". SameSite=Lax only works for
// same-site requests and top-level navigation.
// SameSite=None mandates Secure=true (already enforced in production).
export const authSessionCookieOptions = (maxAge?: number) => ({
  httpOnly: true as const,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as
    | 'none'
    | 'lax',
  path: '/',
  ...(maxAge ? { maxAge } : {}),
});

/** Non-httpOnly presence indicator – value is always "1" */
export const authPresenceCookieOptions = (maxAge?: number) => ({
  httpOnly: false as const,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as
    | 'none'
    | 'lax',
  path: '/',
  ...(maxAge ? { maxAge } : {}),
});
