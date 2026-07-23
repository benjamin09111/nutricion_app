import Cookies from "js-cookie";

/**
 * SECURITY: The JWT is stored exclusively in an httpOnly cookie ('auth_session').
 * It is NEVER accessible from JavaScript – this is intentional (XSS protection).
 *
 * @deprecated Do NOT use this to build Authorization headers.
 * All authenticated requests must use fetchApi() with credentials:"include"
 * so the httpOnly cookie is sent automatically by the browser.
 * This function always returns "" as a safety measure.
 */
export const getAuthToken = (): string => "";

/**
 * Returns true if the user has an active session.
 * Reads the non-httpOnly presence indicator cookie 'auth_session_present'
 * which only holds the value "1" – not the JWT itself.
 */
export const hasActiveSession = (): boolean =>
  Cookies.get("auth_session_present") === "1";
