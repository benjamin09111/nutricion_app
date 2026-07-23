import { resolveRequiredUrl, normalizeUrl } from "./runtime-url.util";
import { clearCurrentUser } from "./current-user";

let preferredApiOrigin: string | null = null;

const getTenantId = () =>
  process.env.NEXT_PUBLIC_TENANT_ID || process.env.TENANT_ID || "";

const getConfiguredApiUrl = () =>
  resolveRequiredUrl(
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_BACKEND_URL,
  );

export const getApiOriginCandidates = () => {
  const candidates = [
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_BACKEND_URL,
    preferredApiOrigin,
  ].filter((origin): origin is string => Boolean(origin));

  return Array.from(new Set(candidates.map((origin) => normalizeUrl(origin))));
};

export const getApiUrl = () => preferredApiOrigin || getConfiguredApiUrl();

export async function fetchApi(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (const origin of getApiOriginCandidates()) {
    try {
      const headers = new Headers(init?.headers || {});
      const tenantId = getTenantId();
      if (tenantId && !headers.has("X-Tenant-ID")) {
        headers.set("X-Tenant-ID", tenantId);
      }

      const requestInit = {
        ...init,
        headers,
        credentials: "include" as RequestCredentials,
      };
      const responseWithTenant = await fetch(`${origin}${path}`, requestInit);

      // Check for presence indicator instead of the actual JWT
      // (the JWT is httpOnly and not accessible via document.cookie)
      const hasSession =
        typeof document !== "undefined" &&
        document.cookie
          .split(";")
          .some((item) => item.trim().startsWith("auth_session_present="));

      if (
        responseWithTenant.status === 401 &&
        hasSession &&
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        const errorMessage = await responseWithTenant
          .clone()
          .json()
          .then((data) => {
            const message = data?.message;
            if (Array.isArray(message)) return message.join(" ");
            if (typeof message === "string") return message;
            return "Tu sesión expiró. Por favor inicia sesión nuevamente.";
          })
          .catch(async () => {
            const text = await responseWithTenant.clone().text().catch(() => "");
            return text || "Tu sesión expiró. Por favor inicia sesión nuevamente.";
          });

        // Prevent multiple toasts/redirects if there are concurrent requests
        if (!(window as any)._isRedirectingToLogin) {
          (window as any)._isRedirectingToLogin = true;
          import("js-cookie").then((m) => {
            // Clear presence indicator – httpOnly JWT cleared by backend /logout
            m.default.remove("auth_session_present");
            // Clean up legacy cookies from old sessions
            m.default.remove("auth_token");
            m.default.remove("auth_token_http");
            m.default.remove("user");
          });
          try { localStorage.removeItem("auth_token"); } catch { /* ignore */ }
          clearCurrentUser();
          import("sonner").then(({ toast }) => {
            toast.error(errorMessage, { id: "session-expired", duration: 3000 });
          });
          const isPortalRoute =
            typeof window !== "undefined" &&
            window.location.pathname.startsWith("/portal");
          const isPlanSessionStale = errorMessage
            .toLowerCase()
            .includes("cambio de plan");
          setTimeout(() => {
            if (isPlanSessionStale) {
              window.location.href = "/sesion-actualizada";
              return;
            }
            window.location.href = isPortalRoute ? "/portal/login" : "/login";
          }, 2000);
        }
        // Return a promise that never resolves so the component just waits while we redirect
        // This prevents component-level "error loading X" toasts from showing up.
        return new Promise(() => {});
      }

      if (
        responseWithTenant.ok ||
        ![404, 502, 503, 504].includes(responseWithTenant.status)
      ) {
        preferredApiOrigin = origin;
        return responseWithTenant;
      }

      lastResponse = responseWithTenant;
    } catch (error) {
      console.error(`[fetchApi] Failed to connect to ${origin}:`, error);
      lastError = error;
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError instanceof Error
    ? lastError
    : new Error("No se pudo conectar con la API.");
}
